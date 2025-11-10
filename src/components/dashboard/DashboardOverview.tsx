import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const DashboardOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [contactsResult, messagesResult, deliveredResult, pendingResult] = await Promise.all([
        supabase.from("contacts").select("*", { count: "exact", head: true }),
        supabase.from("message_logs").select("*", { count: "exact", head: true }),
        supabase.from("message_logs").select("*", { count: "exact", head: true }).eq("status", "delivered"),
        supabase.from("message_logs").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      return {
        totalContacts: contactsResult.count || 0,
        messagesSent: messagesResult.count || 0,
        delivered: deliveredResult.count || 0,
        pending: pendingResult.count || 0,
      };
    },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["recent-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_logs")
        .select(`
          *,
          contacts:contact_id (name)
        `)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  const statsData = [
    {
      title: "Total Contacts",
      value: stats?.totalContacts?.toString() || "0",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Messages Sent",
      value: stats?.messagesSent?.toString() || "0",
      icon: MessageSquare,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Delivered",
      value: stats?.delivered?.toString() || "0",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending",
      value: stats?.pending?.toString() || "0",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {!recentLogs || recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No activity yet. Add contacts and templates to get started!
            </p>
          ) : (
            recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {log.contacts?.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.contacts?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      Message {log.status === "delivered" ? "delivered" : "pending"}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(log.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardOverview;
