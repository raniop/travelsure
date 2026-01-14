import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { Users, UserPlus, DollarSign, CheckCircle2, XCircle, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EventDetailsDialogProps {
  eventId: string;
  groupId: string;
  children: React.ReactNode;
  onPaymentsCalculated?: () => void;
}

interface Member {
  id: string;
  name: string;
  phone: string | null;
}

interface Attendee {
  id: string;
  member_id: string;
  attended: boolean;
  member: Member;
}

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  visit_count: number;
  should_pay: boolean;
}

interface Event {
  id: string;
  event_date: string;
  total_cost: number;
  description: string | null;
}

const EventDetailsDialog = ({ eventId, groupId, children, onPaymentsCalculated }: EventDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestIsFirstTime, setNewGuestIsFirstTime] = useState(true);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadEventDetails();
    }
  }, [open, eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);

      // Load event
      const eventData = await apiClient.getEvent(eventId);
      setEvent(eventData);

      // Load members
      const membersData = await apiClient.getMembers(groupId);
      setMembers(membersData.filter(m => m.is_active !== false));

      // Load attendees
      const attendeesData = await apiClient.getAttendees(eventId);
      // Enrich with member data
      const enrichedAttendees = attendeesData.map((a: any) => {
        const member = membersData.find(m => m.id === a.member_id);
        return {
          ...a,
          member: member
        };
      });
      setAttendees(enrichedAttendees);

      // Load guests
      const guestsData = await apiClient.getGuests(eventId);
      setGuests(guestsData);
    } catch (error: any) {
      console.error("Error loading event details:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את פרטי האירוע",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberAttendance = async (memberId: string, attended: boolean) => {
    const existingAttendee = attendees.find(a => a.member_id === memberId);
    
    // Optimistic update - update UI immediately
    if (existingAttendee) {
      // Update existing attendee (can be true or false)
      setAttendees(prev => prev.map(a => 
        a.member_id === memberId ? { ...a, attended } : a
      ));
    } else if (attended) {
      // Create new attendee only if attended = true
      const newAttendee: Attendee = {
        id: `temp-${Date.now()}`, // Temporary ID
        event_id: eventId,
        member_id: memberId,
        attended: true,
        created_at: new Date().toISOString()
      };
      setAttendees(prev => [...prev, newAttendee]);
    } else {
      // If attended = false and no existing attendee, do nothing
      return;
    }

    // Update server in background
    try {
      if (existingAttendee) {
        // Update existing attendee - always update, even if attended = false
        const updateData = { 
          id: existingAttendee.id,
          event_id: existingAttendee.event_id,
          member_id: existingAttendee.member_id,
          attended: attended, // Explicitly set attended (can be true or false)
          created_at: existingAttendee.created_at
        };
        
        console.log('Updating attendee:', updateData); // Debug log
        
        const updated = await apiClient.updateAttendee(existingAttendee.id, updateData);
        
        console.log('Updated attendee response:', updated); // Debug log
        
        // Update with server response - make sure attended is preserved
        setAttendees(prev => prev.map(a => {
          if (a.member_id === memberId) {
            return { 
              ...a, 
              ...updated,
              attended: updated.attended !== undefined ? updated.attended : attended // Ensure attended is set
            };
          }
          return a;
        }));
      } else if (attended) {
        // Create new attendee
        const created = await apiClient.createAttendee({
          event_id: eventId,
          member_id: memberId,
          attended: true
        });
        // Replace temporary ID with real ID
        setAttendees(prev => prev.map(a => 
          a.member_id === memberId ? { ...a, id: created.id } : a
        ));
      }
    } catch (error: any) {
      console.error('Error updating attendee:', error); // Debug log
      // Rollback on error
      if (existingAttendee) {
        setAttendees(prev => prev.map(a => 
          a.member_id === memberId ? { ...a, attended: !attended } : a
        ));
      } else {
        setAttendees(prev => prev.filter(a => a.member_id !== memberId));
      }
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את ההגעה",
        variant: "destructive"
      });
    }
  };

  const toggleGuestAttendance = async (guestId: string, attended: boolean) => {
    try {
      const guest = guests.find(g => g.id === guestId);
      if (!guest) return;

      await apiClient.updateGuest(guestId, {
        ...guest,
        attended: attended
      });

      await loadEventDetails();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את האורח",
        variant: "destructive"
      });
    }
  };

  const toggleGuestPaymentStatus = async (guestId: string, shouldPay: boolean) => {
    try {
      const guest = guests.find(g => g.id === guestId);
      if (!guest) return;

      // Optimistic update
      setGuests(prev => prev.map(g => 
        g.id === guestId ? { ...g, should_pay: shouldPay } : g
      ));

      await apiClient.updateGuest(guestId, {
        ...guest,
        should_pay: shouldPay
      });

      // Reload to ensure consistency
      await loadEventDetails();
      
      toast({
        title: "הצלחה!",
        description: `האורח עודכן ל-${shouldPay ? "משלם" : "חינם"}`
      });
    } catch (error: any) {
      // Rollback on error
      setGuests(prev => prev.map(g => 
        g.id === guestId ? { ...g, should_pay: !shouldPay } : g
      ));
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את האורח",
        variant: "destructive"
      });
    }
  };

  const addGuest = async () => {
    if (!newGuestName.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם אורח",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use user's selection for first time
      let visitCount = newGuestIsFirstTime ? 1 : 2;
      let shouldPay = !newGuestIsFirstTime; // First time is free, second time pays

      // If not first time and phone provided, check previous visits
      if (!newGuestIsFirstTime && newGuestPhone && event) {
        // Get all events in this group before current event
        const allEvents = await apiClient.getEvents(groupId);
        const currentEventDate = new Date(event.event_date);
        const previousEvents = allEvents.filter(e => new Date(e.event_date) < currentEventDate);
        
        if (previousEvents.length > 0) {
          const previousEventIds = previousEvents.map(e => e.id);
          
          // Get all guests from previous events
          const allGuests = await Promise.all(
            previousEventIds.map(id => apiClient.getGuests(id))
          );
          const flatGuests = allGuests.flat();
          const existingGuests = flatGuests.filter(g => g.phone === newGuestPhone);

          if (existingGuests.length > 0) {
            visitCount = existingGuests.length + 1;
            shouldPay = true; // Second visit and onwards pays
          }
        }
      }

      await apiClient.createGuest({
        event_id: eventId,
        name: newGuestName.trim(),
        phone: newGuestPhone.trim() || null,
        visit_count: visitCount,
        should_pay: shouldPay,
        attended: true // Default to attended when adding
      });

      setNewGuestName("");
      setNewGuestPhone("");
      setNewGuestIsFirstTime(true);
      await loadEventDetails();

      toast({
        title: "הצלחה!",
        description: "האורח נוסף בהצלחה"
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו להוסיף את האורח",
        variant: "destructive"
      });
    }
  };

  const calculatePayments = async () => {
    if (!event) return;

    try {
      setCalculating(true);

      const payingAttendees = attendees.filter(a => a.attended);
      const payingGuests = guests.filter(g => g.should_pay);
      const totalPaying = payingAttendees.length + payingGuests.length;

      if (totalPaying === 0) {
        toast({
          title: "שגיאה",
          description: "אין משתתפים משלמים",
          variant: "destructive"
        });
        return;
      }

      const costPerPerson = event.total_cost / totalPaying;

      // Create/update payments for members
      for (const attendee of payingAttendees) {
        const existingPayment = await apiClient.getPaymentByPayer(eventId, attendee.member_id, "member");

        if (existingPayment) {
          await apiClient.updatePayment(existingPayment.id, {
            ...existingPayment,
            amount: costPerPerson
          });
        } else {
          await apiClient.createPayment({
            event_id: eventId,
            payer_id: attendee.member_id,
            payer_type: "member",
            amount: costPerPerson,
            payment_status: "pending"
          });
        }
      }

      // Create/update payments for guests
      for (const guest of payingGuests) {
        const existingPayment = await apiClient.getPaymentByPayer(eventId, guest.id, "guest");

        if (existingPayment) {
          await apiClient.updatePayment(existingPayment.id, {
            ...existingPayment,
            amount: costPerPerson
          });
        } else {
          await apiClient.createPayment({
            event_id: eventId,
            payer_id: guest.id,
            payer_type: "guest",
            amount: costPerPerson,
            payment_status: "pending"
          });
        }
      }

      toast({
        title: "הצלחה!",
        description: `חושבו תשלומים: ${costPerPerson.toFixed(2)} ₪ לכל משתתף`
      });

      // Close dialog and navigate to payments tab
      setOpen(false);
      if (onPaymentsCalculated) {
        // Small delay to ensure dialog closes smoothly
        setTimeout(() => {
          onPaymentsCalculated();
        }, 100);
      }
    } catch (error: any) {
      console.error("Error calculating payments:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לחשב את התשלומים",
        variant: "destructive"
      });
    } finally {
      setCalculating(false);
    }
  };

  const eventDate = event ? new Date(event.event_date) : new Date();
  const payingAttendees = attendees.filter(a => a.attended);
  const payingGuests = guests.filter(g => g.should_pay);
  const totalPaying = payingAttendees.length + payingGuests.length;
  const costPerPerson = totalPaying > 0 && event ? event.total_cost / totalPaying : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {event ? format(eventDate, "EEEE, d בMMMM yyyy", { locale: he }) : "פרטי האירוע"}
          </DialogTitle>
          <DialogDescription>
            {event?.description || "פרטי האירוע"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">טוען...</div>
        ) : !event ? (
          <div className="text-center py-8">לא הצלחנו לטעון את פרטי האירוע</div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">עלות כוללת</div>
                <div className="text-2xl font-bold">{event.total_cost.toFixed(2)} ₪</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">משלמים</div>
                <div className="text-2xl font-bold">{totalPaying}</div>
                {totalPaying > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {costPerPerson.toFixed(2)} ₪ לאדם
                  </div>
                )}
              </div>
            </div>

            {/* Members */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                חברים קבועים
              </h3>
              <div className="space-y-2">
                {members.map((member) => {
                  const attendee = attendees.find(a => a.member_id === member.id);
                  const attended = attendee?.attended || false;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={attended}
                          onCheckedChange={(checked) =>
                            toggleMemberAttendance(member.id, checked as boolean)
                          }
                        />
                        <span className={attended ? "font-medium" : "text-muted-foreground"}>
                          {member.name}
                        </span>
                      </div>
                      {attended && (
                        <Badge variant="default">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          הגיע
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Guests */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                אורחים
              </h3>
              <div className="space-y-2 mb-4">
                {guests.map((guest) => {
                  const guestAttended = (guest as any).attended !== undefined ? (guest as any).attended : true;
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={guestAttended}
                          onCheckedChange={(checked) => toggleGuestAttendance(guest.id, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium">{guest.name}</div>
                          {guest.phone && (
                            <div className="text-sm text-muted-foreground">{guest.phone}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            ביקור #{guest.visit_count}
                            {guest.visit_count === 1 && " (חינם)"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {guestAttended && (
                          <Badge variant="default">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            הגיע
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 border-r pr-3">
                          <Checkbox
                            id={`guest-free-${guest.id}`}
                            checked={!guest.should_pay}
                            onCheckedChange={(checked) => toggleGuestPaymentStatus(guest.id, !(checked as boolean))}
                          />
                          <Label 
                            htmlFor={`guest-free-${guest.id}`} 
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            <Badge variant={guest.should_pay ? "default" : "secondary"}>
                              {guest.should_pay ? "משלם" : "חינם"}
                            </Badge>
                          </Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Guest */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                <Label>הוסף אורח</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="שם אורח"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="טלפון (אופציונלי)"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addGuest} size="sm">
                    הוסף
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="first-time"
                    checked={newGuestIsFirstTime}
                    onCheckedChange={(checked) => setNewGuestIsFirstTime(checked as boolean)}
                  />
                  <Label htmlFor="first-time" className="text-sm font-normal cursor-pointer">
                    פעם ראשונה (חינם)
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Calculate Payments */}
            <div className="flex justify-end">
              <Button
                onClick={calculatePayments}
                disabled={calculating || totalPaying === 0}
                className="w-full"
              >
                {calculating ? "מחשב..." : "חשב תשלומים"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;
