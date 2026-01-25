import { useState } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreatePollDialogProps {
  groupId: string;
  createdBy: string;
  onPollCreated: () => void;
  children: React.ReactNode;
}

interface PollOption {
  id: string;
  text: string;
}

const CreatePollDialog = ({ groupId, createdBy, onPollCreated, children }: CreatePollDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" }
  ]);
  const [expiresAt, setExpiresAt] = useState("");

  const { toast } = useToast();

  const addOption = () => {
    setOptions([...options, { id: Date.now().toString(), text: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שאלה לסקר",
        variant: "destructive"
      });
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "שגיאה",
        description: "אנא הזן לפחות 2 אפשרויות",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const pollData = {
        group_id: groupId,
        question: question.trim(),
        options: validOptions.map((opt, index) => ({
          id: opt.id,
          text: opt.text.trim(),
          order: index
        })),
        created_by: createdBy,
        is_active: true,
        expires_at: expiresAt || null
      };

      await apiClient.createPoll(pollData);

      toast({
        title: "הצלחה!",
        description: "הסקר נוצר בהצלחה"
      });

      setOpen(false);
      setQuestion("");
      setOptions([
        { id: "1", text: "" },
        { id: "2", text: "" }
      ]);
      setExpiresAt("");
      onPollCreated();
    } catch (error: any) {
      console.error("Error creating poll:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו ליצור את הסקר",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>צור סקר חדש</DialogTitle>
          <DialogDescription>
            צור סקר חדש לחברי הקבוצה. לדוגמה: "מתי נפגשים השבוע?"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">שאלת הסקר</Label>
              <Textarea
                id="question"
                placeholder="לדוגמה: מתי נפגשים השבוע?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>אפשרויות תשובה</Label>
              {options.map((option, index) => (
                <div key={option.id} className="flex gap-2">
                  <Input
                    placeholder={`אפשרות ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    required={index < 2}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                הוסף אפשרות
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">תאריך תפוגה (אופציונלי)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "יוצר..." : "צור סקר"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog;
