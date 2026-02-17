import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Phone, Mail, Trash2, Wallet, MessageCircle, Users, ArrowUpRight, ArrowDownRight, LogOut } from "lucide-react";
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
  userId?: string;
  userPhone?: string;
  onLeaveGroup?: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

interface GuestWithEvent {
  id: string;
  name: string;
  phone: string | null;
  should_pay: boolean;
  event_id: string;
  event_name: string;
  event_date: string;
  cost_per_person: number;
}

const MembersList = ({ groupId, isAdmin = false, userId, userPhone, onLeaveGroup, refreshTrigger }: MembersListProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [guests, setGuests] = useState<GuestWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
    loadGuests();
  }, [groupId, refreshTrigger]); // Add refreshTrigger to dependencies

  const DEPOSIT_PER_MEMBER = 500; // כל חבר מפקיד 500, היתרה = 500 − סכום ניכויים מאירועים

  const loadMembers = async () => {
    try {
      setLoading(true);
      const members = await apiClient.getMembers(groupId);
      const events = await apiClient.getEvents(groupId);
      const allPayments: any[] = [];
      for (const event of events) {
        const payments = await apiClient.getPayments(event.id);
        for (const p of payments) {
          allPayments.push({ ...p, event_id: event.id });
        }
      }
      // יתרה: 500 − ניכויים; אם יש הפקדה נוספת (עדכון יתרה) – היתרה השמורה גבוהה יותר
      const membersWithCorrectBalance = members.map((member: any) => {
        const deducted = allPayments
          .filter((p: any) => p.payer_type === "member" && p.payer_id === member.id && p.payment_status !== "paid")
          .reduce((sum: number, p: any) => sum + parseFloat((p.amount || 0).toFixed(2)), 0);
        const calculatedBalance = parseFloat((DEPOSIT_PER_MEMBER - deducted).toFixed(2));
        const storedBalance = member.balance != null ? parseFloat((member.balance).toFixed(2)) : null;
        // אם היתרה שמורה גבוהה מהמחושבת = הפקיד עוד → להציג ולשמור את השמורה
        const displayBalance = storedBalance != null && storedBalance > calculatedBalance
          ? storedBalance
          : calculatedBalance;
        return { ...member, balance: displayBalance };
      });
      const membersWithRoundedBalances = membersWithCorrectBalance.map((member: any) => ({
        ...member,
        balance: member.balance != null ? parseFloat((member.balance).toFixed(2)) : member.balance
      }));
      // מנהל: תקן ב-API רק כשהמחושב נמוך מהיתרה השמורה (לא לדרוס הפקדה ידנית)
      if (isAdmin) {
        for (const member of membersWithRoundedBalances) {
          const stored = members.find((m: any) => m.id === member.id);
          const storedBalance = stored?.balance != null ? parseFloat((stored.balance).toFixed(2)) : null;
          const deducted = allPayments
            .filter((p: any) => p.payer_type === "member" && p.payer_id === member.id && p.payment_status !== "paid")
            .reduce((sum: number, p: any) => sum + parseFloat((p.amount || 0).toFixed(2)), 0);
          const calculatedBalance = parseFloat((DEPOSIT_PER_MEMBER - deducted).toFixed(2));
          if (storedBalance != null && storedBalance > calculatedBalance) continue;
          if (storedBalance === calculatedBalance) continue;
          try {
            await apiClient.updateMember(member.id, { ...member, balance: calculatedBalance });
          } catch (e) {
            console.error("Error syncing balance for member", member.id, e);
          }
        }
      }
      // Load all users to get profile images
      try {
        const allUsers = await apiClient.getUsers();
        const membersWithImages = membersWithRoundedBalances.map((member: any) => {
          if (member.phone) {
            const user = allUsers.find((u: any) => u.phone === member.phone);
            if (user && user.profile_image) {
              return { ...member, profile_image: user.profile_image };
            }
          }
          return member;
        });
        setMembers(membersWithImages.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (userError) {
        console.error("Error loading users for profile images:", userError);
        setMembers(membersWithRoundedBalances.sort((a, b) => a.name.localeCompare(b.name)));
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

  const loadGuests = async () => {
    try {
      setLoadingGuests(true);
      
      // Get all events for this group
      const allEvents = await apiClient.getEvents(groupId);
      
      // Filter only future events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureEvents = allEvents.filter((event: any) => {
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });
      
      if (futureEvents.length === 0) {
        setGuests([]);
        return;
      }
      
      // Load guests and attendees for each future event
      const guestsWithEvents: GuestWithEvent[] = [];
      
      for (const event of futureEvents) {
        try {
          // Get guests for this event
          const eventGuests = await apiClient.getGuests(event.id);
          
          // Get attendees for this event
          const attendees = await apiClient.getAttendees(event.id);
          const payingAttendees = attendees.filter((a: any) => a.attended);
          const payingGuests = eventGuests.filter((g: any) => g.should_pay);
          const totalPaying = payingAttendees.length + payingGuests.length;
          
          // Calculate cost per person
          const totalCost = event.butcher_cost && event.grocery_cost 
            ? event.butcher_cost + event.grocery_cost 
            : (event.total_cost || 0);
          const costPerPerson = totalPaying > 0 && totalCost > 0 
            ? Math.round((totalCost / totalPaying) * 100) / 100 
            : 0;
          
          // Format event date for display
          const eventDate = new Date(event.event_date);
          const formattedDate = eventDate.toLocaleDateString('he-IL', { 
            day: 'numeric', 
            month: 'numeric',
            year: 'numeric'
          });
          
          // Add guests with event info
          for (const guest of eventGuests) {
            guestsWithEvents.push({
              id: guest.id,
              name: guest.name,
              phone: guest.phone,
              should_pay: guest.should_pay,
              event_id: event.id,
              event_name: event.description || `אירוע ${formattedDate}`,
              event_date: event.event_date,
              cost_per_person: costPerPerson
            });
          }
        } catch (error) {
          console.error(`Error loading guests for event ${event.id}:`, error);
        }
      }
      
      // Sort by event date, then by name
      guestsWithEvents.sort((a, b) => {
        const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.name.localeCompare(b.name);
      });
      
      setGuests(guestsWithEvents);
    } catch (error: any) {
      console.error("Error loading guests:", error);
      // Don't show error toast for guests, just log it
    } finally {
      setLoadingGuests(false);
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

  const renderMemberCard = (member: Member, index: number) => (
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
        {/* Balance: כל חבר התחיל עם 500, מורידים לפי אירועים. מינוס = חייב להשלים */}
        <div
          className={`flex flex-col gap-0.5 items-end px-3 py-2 rounded-lg ${
            (member.balance || 0) >= 0
              ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
              : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
          }`}
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">יתרה</span>
              <span className="text-sm md:text-base font-bold">
                <span dir="ltr" className="tabular-nums">
                  {(member.balance || 0) < 0 ? "-" : ""}
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
          {(member.balance || 0) < 0 && (
            <span className="text-xs font-medium">
              במינוס – יש להשלים {Math.abs(member.balance || 0).toFixed(2)} שקל
            </span>
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingNickname(member.id)}
                >
                  {member.nickname ? "ערוך כינוי" : "הוסף כינוי"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!confirm("האם אתה בטוח שברצונך לצאת מהקבוצה?")) return;
                    
                    try {
                      await apiClient.deleteMember(member.id);
                      toast({
                        title: "הצלחה!",
                        description: "יצאת מהקבוצה בהצלחה."
                      });
                      onLeaveGroup?.();
                    } catch (error: any) {
                      console.error("Error leaving group:", error);
                      toast({
                        title: "שגיאה",
                        description: error.message || "לא הצלחנו לצאת מהקבוצה.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  צא מהקבוצה
                </Button>
              </>
            );
          }
          
          return null;
        })()}

        {isAdmin && (
          <>
            {((member.balance || 0) < 100 || (member.balance || 0) < 0) && member.phone && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const payboxGroupLink = "https://links.payboxapp.com/k5qia1URTZb";
                  const currentBalance = member.balance || 0;
                  const isNegative = currentBalance < 0;
                  const message = isNegative
                    ? `שלום ${member.name}!\n\nהיתרה שלך במינוס: ${currentBalance.toFixed(2)} ₪ (חייב/ת להשלים ${Math.abs(currentBalance).toFixed(2)} ₪).\n\nאנא השלם את הסכום לקבוצת PayBox:\n${payboxGroupLink}\n\nלאחר ההשלמה, המנהל יעדכן את היתרה.`
                    : `שלום ${member.name}!\n\nהיתרה שלך נמוכה: ${currentBalance.toFixed(2)} ₪\n\nאנא הכנס 500 ₪ לקבוצת PayBox:\n${payboxGroupLink}\n\nלאחר ההפקדה, המנהל יעדכן את היתרה שלך.`;
                  
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
                    description: (member.balance || 0) < 0
                      ? `נשלחה בקשה להשלמת יתרה ל-${member.name}`
                      : `נשלחה בקשה להפקדה ל-${member.name}`
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
  );

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
        <>
          {/* Current logged in user - separate at top */}
          {(() => {
            const savedUser = localStorage.getItem('bbq_current_user');
            const userPhone = savedUser ? JSON.parse(savedUser).phone : null;
            const currentUserMember = members.find(m => m.phone === userPhone);
            
            if (!currentUserMember) return null;
            
            const otherMembers = members.filter(m => m.phone !== userPhone);
            
            return (
              <>
                <div className="mb-6">
                  <h3 className="text-lg md:text-xl font-semibold mb-3 text-right">אני</h3>
                  <div
                    className="group relative p-4 rounded-xl border-2 border-primary/30 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-primary/5 via-primary/5 to-muted/20"
                    dir="rtl"
                  >
                    {renderMemberCard(currentUserMember, 0)}
                  </div>
                </div>
                
                {otherMembers.length > 0 && (
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3 text-right">חברים נוספים</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {otherMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className="group relative p-4 rounded-xl border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background via-background to-muted/20"
                          style={{ animationDelay: `${index * 50}ms` }}
                          dir="rtl"
                        >
                          {renderMemberCard(member, index)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Guests Section */}
                {guests.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg md:text-xl font-semibold mb-3 text-right bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                      נספחים
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {guests.map((guest, index) => {
                        const eventDate = new Date(guest.event_date);
                        const formattedDate = eventDate.toLocaleDateString('he-IL', { 
                          day: 'numeric', 
                          month: 'numeric',
                          year: 'numeric'
                        });
                        
                        return (
                          <div
                            key={guest.id}
                            className="group relative p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-purple-50 via-purple-50 to-pink-50"
                            style={{ animationDelay: `${index * 50}ms` }}
                            dir="rtl"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                                  {guest.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 text-right">
                                  <div className="font-semibold text-gray-900">{guest.name}</div>
                                  <div className="text-sm text-gray-600">{formattedDate}</div>
                                  {guest.phone && (
                                    <div className="text-xs text-gray-500">{guest.phone}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {guest.should_pay && guest.cost_per_person > 0 ? (
                                  <Badge className="bg-purple-600 text-white text-sm px-3 py-1">
                                    {guest.cost_per_person.toFixed(2)} ₪
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-sm px-3 py-1">
                                    פטור
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
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
  const [phone, setPhone] = useState("");
  const [checkingUser, setCheckingUser] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין מספר טלפון",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setCheckingUser(true);
      const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
      
      // Check if user exists with this phone
      const user = await apiClient.getUserByPhone(cleanPhone);
      
      if (!user) {
        toast({
          title: "שגיאה",
          description: "לא נמצא משתמש עם מספר טלפון זה. המשתמש צריך להירשם קודם.",
          variant: "destructive"
        });
        return;
      }

      // Check if user is already a member
      const members = await apiClient.getMembers(groupId);
      const existingMember = members.find((m: any) => m.phone === cleanPhone);
      if (existingMember) {
        toast({
          title: "שגיאה",
          description: "המשתמש כבר חבר בקבוצה זו.",
          variant: "destructive"
        });
        return;
      }

      // Check if there's already a pending invitation
      const existingInvitations = await apiClient.getGroupInvitations(cleanPhone, groupId);
      const pendingInvitation = existingInvitations.find((inv: any) => inv.status === 'pending');
      if (pendingInvitation) {
        toast({
          title: "שגיאה",
          description: "כבר נשלחה הזמנה למשתמש זה והיא ממתינה לאישור.",
          variant: "destructive"
        });
        return;
      }

      // Get group details
      const group = await apiClient.getGroup(groupId);
      
      // Create invitation
      await apiClient.createGroupInvitation({
        group_id: groupId,
        user_phone: cleanPhone,
        user_id: user.id,
        user_name: user.name,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      toast({
        title: "הצלחה!",
        description: `נשלחה הזמנה ל-${user.name}. הוא יראה אותה בדשבורד שלו ויוכל לאשר או לדחות.`
      });
      setOpen(false);
      setPhone("");
      onMemberAdded();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לשלוח הזמנה.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setCheckingUser(false);
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
            <DialogTitle>הזמן חבר חדש</DialogTitle>
            <DialogDescription>
              הזמן חבר חדש לקבוצה באמצעות מספר הטלפון שלו.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">טלפון *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading || checkingUser}>
              {loading || checkingUser ? "שולח הזמנה..." : "שלח הזמנה"}
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
    if (isNaN(balanceValue)) {
      toast({
        title: "שגיאה",
        description: "אנא הזן יתרה תקינה (מספר)",
        variant: "destructive"
      });
      return;
    }
    // יתרה שלילית = החבר חרג וחייב להשלים (מותר)

    try {
      setLoading(true);

      // Get current member data
      const members = await apiClient.getMembers(groupId);
      const currentMember = members.find((m: any) => m.id === member.id);
      
      if (!currentMember) {
        throw new Error("חבר לא נמצא");
      }

      // Round only when saving to database (to prevent floating point precision issues)
      // Use parseFloat with toFixed to ensure exactly 2 decimal places
      const roundedBalance = parseFloat(balanceValue.toFixed(2));
      await apiClient.updateMember(member.id, {
        ...currentMember,
        balance: roundedBalance
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
              עדכן יתרה: כל חבר מתחיל עם 500 שקל, מורידים לפי אירועים. מינוס = החבר חייב להשלים.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="balance">יתרה נוכחית (₪) — מינוס = חייב להשלים</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
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
