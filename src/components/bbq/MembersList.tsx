import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Phone, Mail, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Member {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

interface MembersListProps {
  groupId: string;
}

const MembersList = ({ groupId }: MembersListProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const members = await apiClient.getMembers(groupId);
      // Sort by name
      setMembers(members.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error: any) {
      console.error("Error loading members:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את החברים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את החבר הזה?")) return;

    try {
      await apiClient.deleteMember(memberId);

      toast({
        title: "הצלחה!",
        description: "החבר נמחק בהצלחה"
      });

      loadMembers();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו למחוק את החבר",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען חברים...</div>;
  }

  return (
    <div className="space-y-4">
      <AddMemberDialog groupId={groupId} onMemberAdded={loadMembers}>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          הוסף חבר
        </Button>
      </AddMemberDialog>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            עדיין אין חברים. הוסף חבר ראשון!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {member.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {member.phone}
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => deleteMember(member.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    מחק
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface AddMemberDialogProps {
  groupId: string;
  onMemberAdded: () => void;
  children: React.ReactNode;
}

const AddMemberDialog = ({ groupId, onMemberAdded, children }: AddMemberDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      await apiClient.createMember({
        group_id: groupId,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null
      });

      toast({
        title: "הצלחה!",
        description: "החבר נוסף בהצלחה"
      });

      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      onMemberAdded();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו להוסיף את החבר",
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
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>הוסף חבר חדש</DialogTitle>
            <DialogDescription>
              הוסף חבר חדש לקבוצה
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם החבר"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "מוסיף..." : "הוסף"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MembersList;
