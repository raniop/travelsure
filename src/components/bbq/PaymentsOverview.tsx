import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, ExternalLink, Wallet, TrendingDown, Coins, Calendar, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";

interface Payment {
  id: string;
  amount: number;
  payment_status: string;
  payer_type: string;
  payer_id: string;
  event: {
    id: string;
    event_date: string;
    total_cost: number;
  };
  payer_name?: string;
  paid_by_phone?: string;
  paid_by_name?: string;
  paid_at?: string;
  paybox_payment_id?: string;
}

interface PaymentsOverviewProps {
  groupId: string;
  userId?: string;
  isAdmin?: boolean;
}

const PaymentsOverview = ({ groupId, userId, isAdmin = false }: PaymentsOverviewProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0
  });
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadPayments = async () => {
    try {
      setLoading(true);

      // Get all events for this group
      const events = await apiClient.getEvents(groupId);

      if (!events || events.length === 0) {
        setPayments([]);
        setSummary({ total: 0, paid: 0, pending: 0 });
        return;
      }

      // Load all payments for all events
      const allPayments = await Promise.all(
        events.map(e => apiClient.getPayments(e.id))
      );
      const paymentsData = allPayments.flat();

      // Enrich with event and payer names
      const members = await apiClient.getMembers(groupId);
      
      // Load users for profile images
      let usersWithImages: any[] = [];
      try {
        usersWithImages = await apiClient.getUsers();
      } catch (userError) {
        console.error("Error loading users for profile images:", userError);
      }
      
      let enrichedPayments = await Promise.all(
        paymentsData.map(async (payment: any) => {
          let payerName = "לא ידוע";
          let profileImage: string | null = null;
          const event = events.find(e => e.id === payment.event_id);

          if (payment.payer_type === "member") {
            const member = members.find(m => m.id === payment.payer_id);
            if (member) {
              payerName = member.name;
              // Find matching user by phone to get profile image
              if (member.phone) {
                const user = usersWithImages.find((u: any) => u.phone === member.phone);
                if (user && user.profile_image) {
                  profileImage = user.profile_image;
                }
              }
            }
          } else if (payment.payer_type === "guest") {
            // For guests, we need to get from the event
            if (event) {
              const guests = await apiClient.getGuests(event.id);
              const guest = guests.find(g => g.id === payment.payer_id);
              if (guest) payerName = guest.name;
            }
          }

          // Find who actually paid (if different from payer)
          let paidByName = null;
          if (payment.paid_by_phone && payment.paid_by_phone !== payment.payer_id) {
            // Try to find by phone in members
            const paidByMember = members.find(m => m.phone === payment.paid_by_phone);
            if (paidByMember) {
              paidByName = paidByMember.nickname ? `${paidByMember.name} - ${paidByMember.nickname}` : paidByMember.name;
            } else if (event) {
              // Try to find in guests
              const guests = await apiClient.getGuests(event.id);
              const paidByGuest = guests.find(g => g.phone === payment.paid_by_phone);
              if (paidByGuest) {
                paidByName = paidByGuest.name;
              }
            }
            // If not found, use phone number
            if (!paidByName) {
              paidByName = payment.paid_by_phone;
            }
          }

          return {
            ...payment,
            payer_name: payerName,
            paid_by_name: paidByName,
            profile_image: profileImage,
            event: event ? {
              id: event.id,
              event_date: event.event_date,
              total_cost: event.total_cost
            } : null
          };
        })
      );

      // Filter payments by user if not admin - only show payments for events user attended
      if (!isAdmin && userId) {
        const userData = JSON.parse(localStorage.getItem('bbq_current_user') || '{}');
        
        // Get all members to find user's member_id
        const members = await apiClient.getMembers(groupId);
        const userMember = members.find((m: any) => m.phone === userData.phone);
        
        if (!userMember) {
          // If user is not a member, show no payments
          setPayments([]);
          setSummary({ total: 0, paid: 0, pending: 0 });
          return;
        }
        
        const userMemberId = userMember.id;
        
        // Check which events the user attended
        const eventsUserAttended = await Promise.all(
          events.map(async (event) => {
            try {
              const attendees = await apiClient.getAttendees(event.id);
              const userAttended = attendees.some((a: any) => a.member_id === userMemberId && a.attended);
              return userAttended ? event.id : null;
            } catch {
              return null;
            }
          })
        );
        
        const attendedEventIds = eventsUserAttended.filter(id => id !== null);
        
        // Get all guests for all attended events to check guest payments
        const allGuestsForAttendedEvents = await Promise.all(
          events
            .filter(e => attendedEventIds.includes(e.id))
            .map(async (event) => {
              try {
                const guests = await apiClient.getGuests(event.id);
                return { eventId: event.id, guests };
              } catch {
                return { eventId: event.id, guests: [] };
              }
            })
        );
        
        const guestsByEvent = allGuestsForAttendedEvents.reduce((acc, item) => {
          acc[item.eventId] = item.guests;
          return acc;
        }, {} as Record<string, any[]>);
        
        // Filter payments - show only payments for events user attended AND payments for this user
        enrichedPayments = enrichedPayments.filter((payment: any) => {
          // Only show payments for events user attended
          if (!attendedEventIds.includes(payment.event_id)) {
            return false;
          }
          
          // Show payments for this user (member or guest)
          if (payment.payer_type === "member" && userMember) {
            return payment.payer_id === userMember.id;
          }
          
          // For guests, check if guest phone matches user phone
          if (payment.payer_type === "guest") {
            const eventGuests = guestsByEvent[payment.event_id] || [];
            const matchingGuest = eventGuests.find(g => g.id === payment.payer_id && g.phone === userData.phone);
            return !!matchingGuest;
          }
          
          return false;
        });
      }

      // Sort by created_at descending
      enrichedPayments.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setPayments(enrichedPayments);

      // Calculate summary - only show deducted payments (from balance)
      const total = enrichedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const deducted = enrichedPayments
        .filter(p => p.payment_status === "deducted")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setSummary({ total, paid: 0, pending: deducted });

      // Load current balance for the logged-in user
      try {
        if (!isAdmin && userId) {
          const userData = JSON.parse(localStorage.getItem('bbq_current_user') || '{}');
          const members = await apiClient.getMembers(groupId);
          const userMember = members.find((m: any) => m.phone === userData.phone);
          if (userMember) {
            setCurrentBalance(userMember.balance || 0);
          } else {
            setCurrentBalance(0);
          }
        } else if (isAdmin) {
          // For admin, show total balance of all members
          const members = await apiClient.getMembers(groupId);
          const totalBalance = members.reduce((sum: number, m: any) => sum + (m.balance || 0), 0);
          setCurrentBalance(totalBalance);
        } else {
          setCurrentBalance(0);
        }
      } catch (balanceError) {
        console.error("Error loading balance:", balanceError);
        setCurrentBalance(0);
      }
    } catch (error: any) {
      console.error("Error loading payments:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את התשלומים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      toast({
        title: "שגיאה",
        description: "תשלום לא נמצא",
        variant: "destructive"
      });
      return;
    }

    // Save old values for rollback
    const oldSummary = { ...summary };
    const oldPayments = [...payments];

    // Optimistic update - update UI immediately
    const updatedPayment = {
      ...payment,
      payment_status: "paid",
      paid_at: new Date().toISOString()
    };
    
    setPayments(prevPayments => 
      prevPayments.map(p => p.id === paymentId ? updatedPayment : p)
    );

    // Update summary immediately
    const newTotal = summary.total;
    const newPaid = summary.paid + payment.amount;
    const newPending = summary.pending - payment.amount;
    setSummary({ total: newTotal, paid: newPaid, pending: newPending });

    // Update server in background
    try {
      await apiClient.updatePayment(paymentId, updatedPayment);
      
      toast({
        title: "הצלחה!",
        description: "התשלום סומן כמשולם"
      });
    } catch (error: any) {
      // Rollback on error
      setPayments(oldPayments);
      setSummary(oldSummary);
      
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את התשלום",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען תשלומים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 w-full" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      {/* Header */}
      <div className="flex items-center justify-end w-full mb-4" dir="rtl" style={{ direction: "rtl" }}>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent text-right ml-auto">
          תשלומים
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Balance */}
        <Card className={`relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 ${currentBalance !== null && currentBalance < 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10' : 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10'}`}>
          <div className={`absolute top-0 right-0 w-full h-1 ${currentBalance !== null && currentBalance < 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className={`p-2 rounded-lg ${currentBalance !== null && currentBalance < 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                <Wallet className={`w-5 h-5 ${currentBalance !== null && currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <CardTitle className="text-lg font-bold text-right">יתרה נוכחית</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-1 text-right ${currentBalance !== null && currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {currentBalance !== null ? (
                <span dir="ltr" className="tabular-nums">
                  {Math.abs(currentBalance).toFixed(2)}
                </span>
              ) : (
                "טוען..."
              )}
              {" "}שקל
            </div>
            <p className="text-sm text-muted-foreground text-right">
              {isAdmin ? "סה\"כ יתרה" : "היתרה שלך"}
            </p>
          </CardContent>
        </Card>

        {/* Total Deducted */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingDown className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-bold text-right">סה״כ נקזז</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1 text-right">
              <span dir="ltr" className="tabular-nums">{summary.pending.toFixed(2)}</span> שקל
            </div>
            <p className="text-sm text-muted-foreground text-right">
              סך הכל שנקזז מהיתרות
            </p>
          </CardContent>
        </Card>

        {/* Total Payments */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg font-bold text-right">סה״כ תשלומים</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1 text-right">
              <span dir="ltr" className="tabular-nums">{summary.total.toFixed(2)}</span> שקל
            </div>
            <p className="text-sm text-muted-foreground text-right">
              סך הכל תשלומים שנוצרו
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List - Grouped by Event */}
      <div>
        <div className="mb-6" dir="rtl" style={{ direction: "rtl" }}>
          <h3 className="text-lg md:text-xl font-semibold text-right">רשימת תשלומים</h3>
        </div>

        {payments.length === 0 ? (
          <Card className="border-2 shadow-md">
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Wallet className="w-12 h-12 text-primary opacity-50" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">עדיין אין תשלומים</h3>
                  <p className="text-muted-foreground">תשלומים יופיעו כאן לאחר יצירת אירועים</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          (() => {
            // Group payments by event
            const paymentsByEvent = payments.reduce((acc, payment) => {
              const eventId = payment.event?.id || 'unknown';
              if (!acc[eventId]) {
                acc[eventId] = {
                  event: payment.event,
                  payments: []
                };
              }
              acc[eventId].payments.push(payment);
              return acc;
            }, {} as Record<string, { event: any; payments: Payment[] }>);

            // Sort events by date (newest first)
            const sortedEvents = Object.values(paymentsByEvent).sort((a, b) => {
              const dateA = new Date(a.event?.event_date || 0).getTime();
              const dateB = new Date(b.event?.event_date || 0).getTime();
              return dateB - dateA;
            });

            return (
              <div className="space-y-4">
                {sortedEvents.map((eventGroup) => {
                  const eventDate = new Date(eventGroup.event?.event_date || 0);
                  const eventDeducted = eventGroup.payments
                    .filter(p => p.payment_status === "deducted")
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                  
                  const event = eventGroup.event;
                  const totalCost = (event?.butcher_cost || 0) + (event?.grocery_cost || 0) || (event?.total_cost || 0);

                  return (
                    <Card key={eventGroup.event?.id || 'unknown'} className="relative overflow-hidden border-2 shadow-md hover:shadow-lg transition-all duration-200" dir="rtl">
                      {/* Top accent bar */}
                      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4" dir="rtl" style={{ direction: "rtl" }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-950/30">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg md:text-xl font-bold truncate">
                                  {format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}
                                </CardTitle>
                                {eventGroup.event?.description && (
                                  <CardDescription className="mt-1 text-sm text-right line-clamp-2">
                                    {eventGroup.event.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            
                            {/* Event Summary */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                <Coins className="w-4 h-4 text-blue-600" />
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-muted-foreground leading-tight">עלות אירוע</span>
                                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                    <span dir="ltr" className="tabular-nums">{totalCost.toFixed(2)}</span> שקל
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20">
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-muted-foreground leading-tight">נקזז</span>
                                  <span className="text-sm font-bold text-red-700 dark:text-red-400">
                                    <span dir="ltr" className="tabular-nums">{eventDeducted.toFixed(2)}</span> שקל
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-3">
                          {eventGroup.payments
                            .filter((p: any) => p.payment_status === "deducted")
                            .map((payment, index) => {
                            return (
                              <div
                                key={payment.id}
                                className="group relative p-4 rounded-xl border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background via-background to-muted/20"
                                style={{ animationDelay: `${index * 50}ms` }}
                                dir="rtl"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  {/* LEFT: Amount */}
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" dir="rtl">
                                    <div className="flex flex-col items-end">
                                      <span className="text-xs text-muted-foreground">סכום</span>
                                      <span className="text-sm md:text-base font-bold">
                                        <span dir="ltr" className="tabular-nums">{payment.amount.toFixed(2)}</span> שקל
                                      </span>
                                    </div>
                                    <TrendingDown className="w-4 h-4 shrink-0" />
                                  </div>

                                  {/* RIGHT: Member info (pinned to the right edge) */}
                                  <div className="flex items-center gap-2 ml-auto" dir="rtl" style={{ direction: "rtl" }}>
                                    <Avatar className="w-12 h-12 shrink-0">
                                      {(payment as any).profile_image ? (
                                        <AvatarImage src={(payment as any).profile_image} alt={payment.payer_name} />
                                      ) : null}
                                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                                        {payment.payer_name?.charAt(0).toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-end text-right" dir="rtl" style={{ direction: "rtl" }}>
                                      <div className="font-semibold text-base md:text-lg text-right">{payment.payer_name}</div>
                                      <Badge variant="default" className="bg-blue-600 text-xs mt-1">
                                        נקזז מהיתרה
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default PaymentsOverview;
