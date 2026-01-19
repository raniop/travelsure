import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Phone, Mail, Trash2, Wallet, MessageCircle, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  balance?: number; // יתרה חודשית (500 שקל בתחילת החודש)
  nickname?: string | null; // כינוי שהחבר בחר לעצמו
  profile_image?: string | null; // תמונת פרופיל
}

interface MembersListProps {
  groupId: string;
  isAdmin?: boolean;
}

const MembersList = ({ groupId, isAdmin = false }: MembersListProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const members = await apiClient.getMembers(groupId);
      
      // Load all users to get profile images
      try {
        const allUsers = await apiClient.getUsers();
        
        // Match members with users by phone to get profile images
        const membersWithImages = members.map((member: any) => {
          if (member.phone) {
            const user = allUsers.find((u: any) => u.phone === member.phone);
            if (user && user.profile_image) {
              return { ...member, profile_image: user.profile_image };
            }
          }
          return member;
        });
        
        // Sort by name
        setMembers(membersWithImages.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (userError) {
        // If can't load users, just use members without images
        console.error("Error loading users for profile images:", userError);
        setMembers(members.sort((a, b) => a.name.localeCompare(b.name)));
      }
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען חברים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 w-full" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6" dir="rtl" style={{ direction: "rtl" }}>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <AddMemberDialog groupId={groupId} onMemberAdded={loadMembers}>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                הוסף חבר
              </Button>
            </AddMemberDialog>
          )}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent text-right">
          חברים
        </h2>
      </div>

      {members.length === 0 ? (
        <Card className="border-2 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Users className="w-12 h-12 text-primary opacity-50" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {isAdmin ? "עדיין אין חברים" : "עדיין אין חברים בקבוצה"}
                </h3>
                <p className="text-muted-foreground">
                  {isAdmin ? "הוסף חבר ראשון כדי להתחיל!" : "החברים יופיעו כאן לאחר שיתווספו לקבוצה"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="group relative p-4 rounded-xl border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background via-background to-muted/20"
              style={{ animationDelay: `${index * 50}ms` }}
              dir="rtl"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* RIGHT: Member info (pinned to the right edge) */}
                <div className="flex items-center gap-3 ml-auto text-right" dir="rtl" style={{ direction: "rtl" }}>
                  <Avatar className="w-12 h-12 shrink-0">
                    {member.profile_image ? (
                      <AvatarImage src={member.profile_image} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col items-end">
                    <div className="font-semibold text-base md:text-lg text-right">{member.name}</div>
                    {member.nickname && (
                      <div className="text-xs md:text-sm text-muted-foreground text-right">{member.nickname}</div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* LEFT: Stats and Actions */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-start" dir="rtl" style={{ direction: "rtl" }}>
                  {/* Balance */}
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      (member.balance || 0) >= 0
                        ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                    }`}
                    dir="rtl"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">יתרה</span>
                      <span className="text-sm md:text-base font-bold">
                        <span dir="ltr" className="tabular-nums">
                          {Math.abs(member.balance || 0).toFixed(2)}
                        </span>{" "}
                        שקל
                      </span>
                    </div>
                    {(member.balance || 0) >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 shrink-0" />
                    )}
                  </div>

                  {/* Actions */}
                  {(() => {
                    const savedUser = localStorage.getItem('bbq_current_user');
                    const userPhone = savedUser ? JSON.parse(savedUser).phone : null;
                    const isCurrentUser = member.phone === userPhone;
                    
                    if (editingNickname === member.id) {
                      return (
                        <EditNicknameDialog
                          member={member}
                          groupId={groupId}
                          currentNickname={member.nickname || ""}
                          onNicknameUpdated={(newNickname) => {
                            setMembers(prev => prev.map(m => 
                              m.id === member.id ? { ...m, nickname: newNickname } : m
                            ));
                            setEditingNickname(null);
                          }}
                          onCancel={() => setEditingNickname(null)}
                        />
                      );
                    }
                    
                    if (isCurrentUser) {
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingNickname(member.id)}
                        >
                          {member.nickname ? "ערוך כינוי" : "הוסף כינוי"}
                        </Button>
                      );
                    }
                    
                    return null;
                  })()}

                  {isAdmin && (
                    <>
                      {(member.balance || 0) < 100 && member.phone && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            // Send WhatsApp message requesting deposit
                            const payboxGroupLink = "https://links.payboxapp.com/k5qia1URTZb";
                            const currentBalance = member.balance || 0;
                            const message = `שלום ${member.name}!\n\nהיתרה שלך נמוכה: ${currentBalance.toFixed(2)} ₪\n\nאנא הכנס 500 ₪ לקבוצת PayBox:\n${payboxGroupLink}\n\nלאחר ההפקדה, המנהל יעדכן את היתרה שלך.`;
                            
                            // Convert Israeli phone number to international format (+972)
                            let phoneNumber = member.phone.replace(/[^0-9]/g, '');
                            if (phoneNumber.startsWith('0')) {
                              phoneNumber = '972' + phoneNumber.substring(1);
                            } else if (!phoneNumber.startsWith('972')) {
                              phoneNumber = '972' + phoneNumber;
                            }
                            
                            // Create WhatsApp link
                            const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                            
                            // Open WhatsApp in new window
                            window.open(whatsappLink, '_blank');
                            
                            toast({
                              title: "נשלחה הודעת WhatsApp",
                              description: `נשלחה בקשה להפקדה ל-${member.name}`
                            });
                          }}
                        >
                          <MessageCircle className="w-4 h-4 ml-2" />
                          בקש הפקדה
                        </Button>
                      )}
                      <UpdateBalanceDialog 
                        member={member} 
                        groupId={groupId}
                        onBalanceUpdated={loadMembers}
                      >
                        <Button variant="outline" size="sm">
                          עדכן יתרה
                        </Button>
                      </UpdateBalanceDialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        מחק
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
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
  const [nickname, setNickname] = useState("");
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
        email: email.trim() || null,
        nickname: nickname.trim() || null
      });

      toast({
        title: "הצלחה!",
        description: "החבר נוסף בהצלחה"
      });

      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setNickname("");
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
            <div className="grid gap-2">
              <Label htmlFor="nickname">כינוי (אופציונלי)</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="כינוי שהחבר יבחר לעצמו"
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

interface UpdateBalanceDialogProps {
  member: Member;
  groupId: string;
  onBalanceUpdated: () => void;
  children: React.ReactNode;
}

const UpdateBalanceDialog = ({ member, groupId, onBalanceUpdated, children }: UpdateBalanceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState((member.balance || 0).toString());
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const balanceValue = parseFloat(balance);
    if (isNaN(balanceValue) || balanceValue < 0) {
      toast({
        title: "שגיאה",
        description: "אנא הזן יתרה תקינה (מספר חיובי)",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Get current member data
      const members = await apiClient.getMembers(groupId);
      const currentMember = members.find((m: any) => m.id === member.id);
      
      if (!currentMember) {
        throw new Error("חבר לא נמצא");
      }

      // Update member with new balance
      await apiClient.updateMember(member.id, {
        ...currentMember,
        balance: balanceValue
      });

      toast({
        title: "הצלחה!",
        description: "היתרה עודכנה בהצלחה"
      });

      setOpen(false);
      onBalanceUpdated();
    } catch (error: any) {
      console.error("Error updating balance:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את היתרה",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd500 = () => {
    const currentBalance = parseFloat(balance) || 0;
    setBalance((currentBalance + 500).toString());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>עדכן יתרה - {member.name}</DialogTitle>
            <DialogDescription>
              עדכן את היתרה החודשית של החבר (500 שקל בתחילת החודש)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="balance">יתרה נוכחית (₪)</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                dir="rtl"
                className="text-right"
                required
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAdd500}
              className="w-full"
            >
              <Wallet className="w-4 h-4 ml-2" />
              הוסף 500 ₪ (תחילת חודש)
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "מעדכן..." : "עדכן"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface EditNicknameDialogProps {
  member: Member;
  groupId: string;
  currentNickname: string;
  onNicknameUpdated: (nickname: string) => void;
  onCancel: () => void;
}

const EditNicknameDialog = ({ member, groupId, currentNickname, onNicknameUpdated, onCancel }: EditNicknameDialogProps) => {
  const [nickname, setNickname] = useState(currentNickname);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Get current member data
      const members = await apiClient.getMembers(groupId);
      const currentMember = members.find((m: any) => m.id === member.id);
      
      if (!currentMember) {
        throw new Error("חבר לא נמצא");
      }

      // Update member with new nickname
      await apiClient.updateMember(member.id, {
        ...currentMember,
        nickname: nickname.trim() || null
      });

      toast({
        title: "הצלחה!",
        description: "הכינוי עודכן בהצלחה"
      });

      onNicknameUpdated(nickname.trim() || "");
    } catch (error: any) {
      console.error("Error updating nickname:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את הכינוי",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 p-3 border rounded-lg bg-muted/50">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Label htmlFor="nickname-input" className="text-sm">כינוי</Label>
        <Input
          id="nickname-input"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="הזן כינוי (אופציונלי)"
          dir="rtl"
          className="text-right"
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="flex-1"
          >
            {loading ? "שומר..." : "שמור"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MembersList;
