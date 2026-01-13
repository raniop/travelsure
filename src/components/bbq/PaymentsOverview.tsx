import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
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
}

const PaymentsOverview = ({ groupId }: PaymentsOverviewProps) => {
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
      const enrichedPayments = await Promise.all(
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
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error("Payment not found");
      
      await apiClient.updatePayment(paymentId, {
        ...payment,
        payment_status: "paid",
        paid_at: new Date().toISOString()
      });

      toast({
        title: "הצלחה!",
        description: "התשלום סומן כמשולם"
      });

      loadPayments();
    } catch (error: any) {
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
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

      {/* Payments List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">רשימת תשלומים</h3>
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              עדיין אין תשלומים
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => {
              const eventDate = new Date(payment.event.event_date);
              const isPaid = payment.payment_status === "paid" || payment.payment_status === "confirmed";

              return (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{payment.payer_name}</span>
                          <Badge variant={isPaid ? "default" : "secondary"}>
                            {isPaid ? "שולם" : "ממתין"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(eventDate, "d בMMMM yyyy", { locale: he })} • {payment.amount.toFixed(2)} ₪
                        </div>
                      </div>
                      {!isPaid && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              // Generate payment link (PayBox/Bit format)
                              // You can customize this URL based on your payment provider
                              const paymentLink = `https://payboxapp.co.il/pay?amount=${payment.amount}&description=תשלום%20לעל%20האש&event=${payment.event.id}`;
                              window.open(paymentLink, '_blank');
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsOverview;
