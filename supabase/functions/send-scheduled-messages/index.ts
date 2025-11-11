import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting scheduled message check...');

    // Get all active schedule configurations
    const { data: schedules, error: scheduleError } = await supabaseClient
      .from('schedule_config')
      .select('*')
      .eq('is_active', true);

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      throw scheduleError;
    }

    console.log(`Found ${schedules?.length || 0} active schedules`);

    let totalMessagesSent = 0;

    for (const schedule of schedules || []) {
      // Convert UTC time to Nigerian timezone (Africa/Lagos, UTC+1)
      const now = new Date();
      const nigerianTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
      
      const currentDay = nigerianTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Lagos' });
      const currentHours = nigerianTime.getHours().toString().padStart(2, '0');
      const currentMinutes = nigerianTime.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;

      console.log(`Nigerian time - Day: ${currentDay}, Time: ${currentTime}`);

      // Check if today is a scheduled day
      if (!schedule.send_days.includes(currentDay)) {
        console.log(`Skipping schedule ${schedule.id}: Today (${currentDay}) is not a scheduled day`);
        continue;
      }

      // Check if it's time to send (within current minute)
      const scheduledTime = schedule.send_time.slice(0, 5); // Get HH:MM from time
      console.log(`Checking schedule ${schedule.id}: Current time ${currentTime}, Scheduled time ${scheduledTime}`);

      // Only process if time matches
      if (currentTime !== scheduledTime) {
        console.log(`Skipping schedule ${schedule.id}: Time doesn't match`);
        continue;
      }

      // Get user's contacts
      const { data: contacts, error: contactsError } = await supabaseClient
        .from('contacts')
        .select('*')
        .eq('user_id', schedule.user_id)
        .eq('status', 'active');

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        continue;
      }

      console.log(`Found ${contacts?.length || 0} active contacts for user ${schedule.user_id}`);

      // Get the default template
      let templateContent = 'Hello {name}! This is your scheduled message.';
      if (schedule.default_template_id) {
        const { data: template, error: templateError } = await supabaseClient
          .from('message_templates')
          .select('content')
          .eq('id', schedule.default_template_id)
          .single();

        if (!templateError && template) {
          templateContent = template.content;
        }
      }

      // Create message logs for each contact
      for (const contact of contacts || []) {
        const personalizedMessage = templateContent.replace(/{name}/g, contact.name);
        const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(personalizedMessage)}`;

        // Log the message (in a real implementation, you would send via WhatsApp API)
        const { error: logError } = await supabaseClient
          .from('message_logs')
          .insert({
            user_id: schedule.user_id,
            contact_id: contact.id,
            template_id: schedule.default_template_id,
            message_content: personalizedMessage,
            status: 'pending', // Would be 'sent' with real WhatsApp API
          });

        if (logError) {
          console.error('Error creating message log:', logError);
        } else {
          totalMessagesSent++;
          console.log(`Created message log for ${contact.name}: ${whatsappUrl}`);
        }
      }
    }

    console.log(`Scheduled message check complete. Total messages logged: ${totalMessagesSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${totalMessagesSent} scheduled messages`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-scheduled-messages function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
