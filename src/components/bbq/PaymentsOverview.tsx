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
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
    
    // Auto-refresh payments every 10 seconds to check for PayBox updates
    const interval = setInterval(() => {
      loadPayments();
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
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
      let enrichedPayments = await Promise.all(
        paymentsData.map(async (payment: any) => {
          let payerName = "לא ידוע";
          const event = events.find(e => e.id === payment.event_id);

          if (payment.payer_type === "member") {
            const members = await apiClient.getMembers(groupId);
            const member = members.find(m => m.id === payment.payer_id);
            if (member) payerName = member.name;
          } else if (payment.payer_type === "guest") {
            // For guests, we need to get from the event
            if (event) {
              const guests = await apiClient.getGuests(event.id);
              const guest = guests.find(g => g.id === payment.payer_id);
              if (guest) payerName = guest.name;
            }
          }

          return {
            ...payment,
            payer_name: payerName,
            event: event ? {
              id: event.id,
              event_date: event.event_date,
              total_cost: event.total_cost
            } : null
          };
        })
      );

      // Filter payments by user if not admin
      if (!isAdmin && userId) {
        const userData = JSON.parse(localStorage.getItem('bbq_current_user') || '{}');
        
        // Get all members to match user
        const members = await apiClient.getMembers(groupId);
        const userMember = members.find(m => {
          // Match by phone or name
          return m.phone === userData.phone || m.name === userData.name;
        });

        // Get all guests from all events to match user
        const allGuests = await Promise.all(
          events.map(e => apiClient.getGuests(e.id))
        );
        const flatGuests = allGuests.flat();
        const userGuests = flatGuests.filter(g => g.phone === userData.phone);

        // Filter payments - show only payments for this user
        enrichedPayments = enrichedPayments.filter((payment: any) => {
          // If payment has user_id, use it
          if (payment.user_id) {
            return payment.user_id === userId;
          }
          
          // Otherwise, try to match by payer (member or guest)
          if (payment.payer_type === "member" && userMember) {
            return payment.payer_id === userMember.id;
          }
          
          // For guests, check if guest phone matches user phone
          if (payment.payer_type === "guest") {
            const matchingGuest = userGuests.find(g => g.id === payment.payer_id);
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

      // Calculate summary
      const total = enrichedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paid = enrichedPayments
        .filter(p => p.payment_status === "paid" || p.payment_status === "confirmed")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const pending = total - paid;

      setSummary({ total, paid, pending });
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ תשלומים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total.toFixed(2)} ₪</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שולם</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.paid.toFixed(2)} ₪</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתין לתשלום</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.pending.toFixed(2)} ₪</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List - Grouped by Event */}
      <div>
        <h3 className="text-lg font-semibold mb-4">רשימת תשלומים</h3>
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
                  const eventTotal = eventGroup.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  const eventPaid = eventGroup.payments
                    .filter(p => p.payment_status === "paid" || p.payment_status === "confirmed")
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                  const eventPending = eventTotal - eventPaid;

                  return (
                    <Card key={eventGroup.event?.id || 'unknown'} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}
                            </CardTitle>
                            {eventGroup.event?.description && (
                              <CardDescription className="mt-1">
                                {eventGroup.event.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">סה״כ אירוע</div>
                            <div className="text-xl font-bold">{eventGroup.event?.total_cost?.toFixed(2) || '0.00'} ₪</div>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">שולם: </span>
                            <span className="font-semibold text-green-600">{eventPaid.toFixed(2)} ₪</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ממתין: </span>
                            <span className="font-semibold text-orange-600">{eventPending.toFixed(2)} ₪</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {eventGroup.payments.map((payment) => {
                            const isPaid = payment.payment_status === "paid" || payment.payment_status === "confirmed";

                            return (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{payment.payer_name}</span>
                                    <Badge variant={isPaid ? "default" : "secondary"}>
                                      {isPaid ? "שולם" : "ממתין"}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {payment.amount.toFixed(2)} ₪
                                  </div>
                                </div>
                                {!isPaid && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        // PayBox group link - users join the group and pay there
                                        // The group link: https://links.payboxapp.com/k5qia1URTZb
                                        const payboxGroupLink = "https://links.payboxapp.com/k5qia1URTZb";
                                        
                                        window.open(payboxGroupLink, '_blank');
                                        
                                        toast({
                                          title: "קישור קבוצת PayBox נפתח",
                                          description: `הצטרף לקבוצה ושלם ${payment.amount.toFixed(2)} ₪. המערכת תתעדכן אוטומטית תוך 10 שניות אחרי התשלום.`,
                                        });
                                      }}
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      שלם עכשיו
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => markAsPaid(payment.id)}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      סמן כמשולם
                                    </Button>
                                  </div>
                                )}
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
