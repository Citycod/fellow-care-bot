import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Edit, Trash2, MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Name must be less than 100 characters"),
  category: z.string().min(1, "Category is required").max(50, "Category must be less than 50 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(1000, "Content must be less than 1000 characters"),
});

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

const MessagesSection = () => {
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: messageLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["message-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_logs")
        .select(`
          *,
          contacts (name, phone),
          message_templates (name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (template: MessageTemplate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (template.id && !showNewTemplate) {
        const { error } = await supabase
          .from("message_templates")
          .update({
            name: template.name,
            category: template.category,
            content: template.content,
          })
          .eq("id", template.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({
            name: template.name,
            category: template.category,
            content: template.content,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast.success(showNewTemplate ? "Template created successfully!" : "Template updated successfully!");
      setEditingTemplate(null);
      setShowNewTemplate(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast.success("Template deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    try {
      templateSchema.parse(editingTemplate);
      saveMutation.mutate(editingTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleDeleteTemplate = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleNewTemplate = () => {
    setShowNewTemplate(true);
    setEditingTemplate({
      id: crypto.randomUUID(),
      name: "",
      category: "",
      content: "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Message Templates List */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Message Templates</h2>
            <Button onClick={handleNewTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          {/* Template Editor */}
          {(editingTemplate || showNewTemplate) && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Welcome Message"
                    value={editingTemplate?.name || ""}
                    onChange={(e) =>
                      setEditingTemplate(
                        editingTemplate
                          ? { ...editingTemplate, name: e.target.value }
                          : { id: crypto.randomUUID(), name: e.target.value, content: "", category: "" }
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Input
                    id="template-category"
                    placeholder="e.g., Welcome, Follow-up, Reminder"
                    value={editingTemplate?.category || ""}
                    onChange={(e) =>
                      editingTemplate &&
                      setEditingTemplate({ ...editingTemplate, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="template-content">Message Content</Label>
                  <Textarea
                    id="template-content"
                    placeholder="Use {name} to personalize with contact's name"
                    rows={6}
                    value={editingTemplate?.content || ""}
                    onChange={(e) =>
                      editingTemplate &&
                      setEditingTemplate({ ...editingTemplate, content: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Use {"{name}"} as a placeholder for the contact's name
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveTemplate} disabled={saveMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? "Saving..." : "Save Template"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(null);
                      setShowNewTemplate(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Templates Grid */}
          {templates.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No templates yet. Create your first template to get started!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template: any) => (
                <Card key={template.id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                          {template.category}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowNewTemplate(false);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.content}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Message History */}
          <Card>
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-foreground">Message History</h3>
              <p className="text-sm text-muted-foreground">View all sent and scheduled messages</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Message</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Template</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                        Loading message history...
                      </td>
                    </tr>
                  ) : messageLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                        No messages sent yet. Start sending messages to see them here!
                      </td>
                    </tr>
                  ) : (
                    messageLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-foreground">{log.contacts?.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{log.contacts?.phone || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {log.message_content}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {log.message_templates?.name || "Custom"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="text-sm capitalize">{log.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : 
                           new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagesSection;
