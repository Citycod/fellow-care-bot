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
    const { contactId, templateId, customMessage } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Sending message for user: ${user.id}`);

    // Get contact details
    const { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    // Get message content
    let messageContent = customMessage;
    if (templateId && !customMessage) {
      const { data: template, error: templateError } = await supabaseClient
        .from('message_templates')
        .select('content')
        .eq('id', templateId)
        .eq('user_id', user.id)
        .single();

      if (templateError) {
        throw new Error('Template not found');
      }

      messageContent = template.content.replace(/{name}/g, contact.name);
    }

    if (!messageContent) {
      throw new Error('No message content provided');
    }

    // Validate message length
    if (messageContent.length > 1000) {
      throw new Error('Message too long (max 1000 characters)');
    }

    // Create WhatsApp URL
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageContent)}`;

    // Log the message
    const { error: logError } = await supabaseClient
      .from('message_logs')
      .insert({
        user_id: user.id,
        contact_id: contact.id,
        template_id: templateId || null,
        message_content: messageContent,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging message:', logError);
    }

    console.log(`WhatsApp URL generated for ${contact.name}: ${whatsappUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        whatsappUrl,
        message: 'WhatsApp link generated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-whatsapp-message function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
