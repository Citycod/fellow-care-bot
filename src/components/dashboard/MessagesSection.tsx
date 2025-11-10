import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MessageTemplate {
  id: number;
  name: string;
  content: string;
  category: string;
}

const MessagesSection = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: 1,
      name: "Welcome Message",
      content: "Hi {name}! 👋 Welcome to our fellowship. We're excited to have you join us. Feel free to reach out if you have any questions!",
      category: "Welcome",
    },
    {
      id: 2,
      name: "Weekly Check-in",
      content: "Hello {name}! 😊 Just checking in to see how you're doing this week. Remember, we're here for you!",
      category: "Follow-up",
    },
    {
      id: 3,
      name: "Event Reminder",
      content: "Hi {name}! 📅 Don't forget about our upcoming fellowship meeting this Friday at 7 PM. Looking forward to seeing you there!",
      category: "Reminder",
    },
  ]);

  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates(
        templates.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
      );
      toast.success("Template updated successfully!");
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast.success("Template deleted successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Message Templates List */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Message Templates</h2>
        <Button onClick={() => setShowNewTemplate(true)}>
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
                      : { id: Date.now(), name: e.target.value, content: "", category: "" }
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
              <Button onClick={handleSaveTemplate}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
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
                    onClick={() => setEditingTemplate(template)}
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
    </div>
  );
};

export default MessagesSection;
