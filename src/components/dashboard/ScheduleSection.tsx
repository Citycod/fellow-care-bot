import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Play, Pause, TestTube } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ScheduleSection = () => {
  const queryClient = useQueryClient();
  const [scheduleConfig, setScheduleConfig] = useState({
    is_active: true,
    send_days: ["Monday", "Friday"],
    send_time: "10:00",
    timezone: "UTC",
    default_template_id: null as string | null,
  });

  const { data: config } = useQuery({
    queryKey: ["schedule-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setScheduleConfig({
        is_active: config.is_active,
        send_days: config.send_days || ["Monday", "Friday"],
        send_time: config.send_time || "10:00",
        timezone: config.timezone || "UTC",
        default_template_id: config.default_template_id,
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const configData = {
        user_id: user.id,
        is_active: scheduleConfig.is_active,
        send_days: scheduleConfig.send_days,
        send_time: scheduleConfig.send_time,
        timezone: scheduleConfig.timezone,
        default_template_id: scheduleConfig.default_template_id,
      };

      if (config) {
        const { error } = await supabase
          .from("schedule_config")
          .update(configData)
          .eq("id", config.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("schedule_config")
          .insert(configData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-config"] });
      toast.success("Schedule settings saved!");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleDayToggle = (day: string) => {
    if (scheduleConfig.send_days.includes(day)) {
      setScheduleConfig({
        ...scheduleConfig,
        send_days: scheduleConfig.send_days.filter((d) => d !== day),
      });
    } else {
      setScheduleConfig({
        ...scheduleConfig,
        send_days: [...scheduleConfig.send_days, day],
      });
    }
  };

  const handleToggleSchedule = () => {
    setScheduleConfig({ ...scheduleConfig, is_active: !scheduleConfig.is_active });
  };

  const testScheduleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-scheduled-messages");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Test completed! Check your contacts.");
      queryClient.invalidateQueries({ queryKey: ["message-logs"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to test scheduled messages");
    },
  });

  return (
    <div className="space-y-6">
      {/* Schedule Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${
                scheduleConfig.is_active ? "bg-success/10" : "bg-muted"
              }`}
            >
              {scheduleConfig.is_active ? (
                <Play className="w-6 h-6 text-success" />
              ) : (
                <Pause className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Schedule Status
              </h3>
              <p className="text-sm text-muted-foreground">
                {scheduleConfig.is_active
                  ? "Messages will be sent automatically (via WhatsApp URL links)"
                  : "Schedule is currently paused"}
              </p>
            </div>
          </div>
          <Switch
            checked={scheduleConfig.is_active}
            onCheckedChange={handleToggleSchedule}
          />
        </div>
      </Card>

      {/* Schedule Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Schedule Configuration
        </h3>
        
        <div className="space-y-6">
          {/* Days Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              Send Messages On
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => handleDayToggle(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scheduleConfig.send_days.includes(day)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <Label htmlFor="time" className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              Send Time
            </Label>
            <input
              id="time"
              type="time"
              value={scheduleConfig.send_time}
              onChange={(e) =>
                setScheduleConfig({ ...scheduleConfig, send_time: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone" className="mb-3 block">
              Timezone
            </Label>
            <Select
              value={scheduleConfig.timezone}
              onValueChange={(value) =>
                setScheduleConfig({ ...scheduleConfig, timezone: value })
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                <SelectItem value="CST">Central Time (CST)</SelectItem>
                <SelectItem value="PST">Pacific Time (PST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Template */}
          <div>
            <Label htmlFor="template" className="mb-3 block">
              Default Message Template
            </Label>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No templates available. Create templates in the Messages tab first.
              </p>
            ) : (
              <Select
                value={scheduleConfig.default_template_id || undefined}
                onValueChange={(value) =>
                  setScheduleConfig({ ...scheduleConfig, default_template_id: value })
                }
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1" 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save Schedule Settings"}
            </Button>
            <Button
              variant="outline"
              onClick={() => testScheduleMutation.mutate()}
              disabled={testScheduleMutation.isPending}
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testScheduleMutation.isPending ? "Testing..." : "Test Now"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          📱 WhatsApp Integration
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Currently using WhatsApp URL-based messaging (wa.me links). When scheduled times arrive, 
            the system will generate WhatsApp links for each contact.
          </p>
          <p className="font-medium text-foreground">
            For automated sending, consider upgrading to WhatsApp Business API (via Twilio, MessageBird, etc.)
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ScheduleSection;
