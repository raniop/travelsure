import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
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
      let enrichedPayments = await Promise.all(
        paymentsData.map(async (payment: any) => {
          let payerName = "לא ידוע";
          const event = events.find(e => e.id === payment.event_id);

          if (payment.payer_type === "member") {
            const member = members.find(m => m.id === payment.payer_id);
            if (member) {
              payerName = member.nickname ? `${member.name} - ${member.nickname}` : member.name;
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
    return <div className="text-center py-8">טוען תשלומים...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ flexDirection: 'row-reverse' }}>
            <CardTitle className="text-sm font-medium text-right">יתרה נוכחית</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-right ${currentBalance !== null && currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {currentBalance !== null ? `${currentBalance.toFixed(2)} ₪` : "טוען..."}
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              {isAdmin ? "סה\"כ יתרה" : "היתרה שלך"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ flexDirection: 'row-reverse' }}>
            <CardTitle className="text-sm font-medium text-right">סה״כ נקזז מהיתרה</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 text-right">
              {summary.pending.toFixed(2)} ₪
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              סך הכל שנקזז מהיתרות
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ flexDirection: 'row-reverse' }}>
            <CardTitle className="text-sm font-medium text-right">סה״כ תשלומים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{summary.total.toFixed(2)} ₪</div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              סך הכל תשלומים שנוצרו
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List - Grouped by Event */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-right">רשימת תשלומים</h3>
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              עדיין אין תשלומים
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
              <div className="space-y-6">
                {sortedEvents.map((eventGroup) => {
                  const eventDate = new Date(eventGroup.event?.event_date || 0);
                  const eventDeducted = eventGroup.payments
                    .filter(p => p.payment_status === "deducted")
                    .reduce((sum, p) => sum + (p.amount || 0), 0);

                  return (
                    <Card key={eventGroup.event?.id || 'unknown'} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <div className="flex items-center justify-between" style={{ flexDirection: 'row-reverse' }}>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">סה״כ אירוע</div>
                            <div className="text-xl font-bold">
                              {(() => {
                                const event = eventGroup.event;
                                const total = (event?.butcher_cost || 0) + (event?.grocery_cost || 0) || (event?.total_cost || 0);
                                return total.toFixed(2);
                              })()} ₪
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-lg text-right">
                              {format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}
                            </CardTitle>
                            {eventGroup.event?.description && (
                              <CardDescription className="mt-1 text-right">
                                {eventGroup.event.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 mt-4 text-sm justify-end">
                          <div className="text-right">
                            <span className="text-muted-foreground">נקזז מהיתרה: </span>
                            <span className="font-semibold text-blue-600">{eventDeducted.toFixed(2)} ₪</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {eventGroup.payments
                            .filter((p: any) => p.payment_status === "deducted")
                            .map((payment) => {
                            return (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 text-right">
                                  <div className="flex items-center gap-2 mb-1 justify-end">
                                    <Badge variant="default" className="bg-blue-600">
                                      נקזז מהיתרה
                                    </Badge>
                                    <span className="font-medium">{payment.payer_name}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {payment.amount.toFixed(2)} ₪
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
