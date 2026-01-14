import { useState } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
}

interface GroupSettingsProps {
  group: Group;
  onGroupUpdated: () => void;
}

const GroupSettings = ({ group, onGroupUpdated }: GroupSettingsProps) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await apiClient.updateGroup(group.id, {
        ...group,
        name: name.trim(),
        description: description.trim() || null
      });

      toast({
        title: "הצלחה!",
        description: "ההגדרות עודכנו בהצלחה"
      });

      onGroupUpdated();
    } catch (error: any) {
      console.error("Error updating group:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את ההגדרות",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>הגדרות קבוצה</CardTitle>
        <CardDescription>ערוך את פרטי הקבוצה</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">שם הקבוצה</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם הקבוצה"
              required
              className="text-right"
              dir="rtl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור הקבוצה..."
              rows={3}
              className="text-right"
              dir="rtl"
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 ml-2" />
            {loading ? "שומר..." : "שמור שינויים"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GroupSettings;
