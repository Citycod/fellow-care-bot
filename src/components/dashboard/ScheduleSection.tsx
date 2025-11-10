import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Play, Pause } from "lucide-react";
import { toast } from "sonner";

const ScheduleSection = () => {
  const [isScheduleActive, setIsScheduleActive] = useState(true);
  const [scheduleConfig, setScheduleConfig] = useState({
    days: ["Monday", "Friday"],
    time: "10:00",
    timezone: "UTC",
    template: "Welcome Message",
  });

  const handleToggleSchedule = () => {
    setIsScheduleActive(!isScheduleActive);
    toast.success(
      isScheduleActive ? "Schedule paused" : "Schedule activated"
    );
  };

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
    if (scheduleConfig.days.includes(day)) {
      setScheduleConfig({
        ...scheduleConfig,
        days: scheduleConfig.days.filter((d) => d !== day),
      });
    } else {
      setScheduleConfig({
        ...scheduleConfig,
        days: [...scheduleConfig.days, day],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${
                isScheduleActive ? "bg-success/10" : "bg-muted"
              }`}
            >
              {isScheduleActive ? (
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
                {isScheduleActive
                  ? "Messages are being sent automatically"
                  : "Schedule is currently paused"}
              </p>
            </div>
          </div>
          <Switch
            checked={isScheduleActive}
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
                    scheduleConfig.days.includes(day)
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
              value={scheduleConfig.time}
              onChange={(e) =>
                setScheduleConfig({ ...scheduleConfig, time: e.target.value })
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
            <Select
              value={scheduleConfig.template}
              onValueChange={(value) =>
                setScheduleConfig({ ...scheduleConfig, template: value })
              }
            >
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Welcome Message">Welcome Message</SelectItem>
                <SelectItem value="Weekly Check-in">Weekly Check-in</SelectItem>
                <SelectItem value="Event Reminder">Event Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={() => toast.success("Schedule settings saved!")}>
            Save Schedule Settings
          </Button>
        </div>
      </Card>

      {/* Next Scheduled Messages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Upcoming Messages
        </h3>
        <div className="space-y-3">
          {[
            { date: "Monday, Jan 20", time: "10:00 AM", recipients: 24 },
            { date: "Friday, Jan 24", time: "10:00 AM", recipients: 24 },
            { date: "Monday, Jan 27", time: "10:00 AM", recipients: 24 },
          ].map((message, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div>
                <p className="font-medium text-foreground">{message.date}</p>
                <p className="text-sm text-muted-foreground">{message.time}</p>
              </div>
              <span className="text-sm font-medium text-primary">
                {message.recipients} recipients
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ScheduleSection;
