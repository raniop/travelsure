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
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { Users, UserPlus, CheckCircle2, XCircle, Edit2, Trash2, Save, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventDetailsDialogProps {
  eventId: string;
  groupId: string;
  userId: string;
  isAdmin: boolean;
  children: React.ReactNode;
  onPaymentsCalculated?: () => void;
}

interface Member {
  id: string;
  name: string;
  phone: string | null;
  nickname?: string;
}

interface Attendee {
  id: string;
  event_id?: string;
  member_id: string;
  attended: boolean;
  pays_with_group?: boolean;
  created_at?: string;
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
  total_cost?: number;
  butcher_cost?: number;
  grocery_cost?: number;
  description: string | null;
  host_member_id?: string | null;
}

const EventDetailsDialog = ({ eventId, groupId, userId, isAdmin, children, onPaymentsCalculated }: EventDetailsDialogProps) => {
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
  const [hasPayments, setHasPayments] = useState(false);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [editedButcherCost, setEditedButcherCost] = useState("");
  const [editedGroceryCost, setEditedGroceryCost] = useState("");
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [editedHostMemberId, setEditedHostMemberId] = useState<string>("");
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editedTime, setEditedTime] = useState<string>("21:00");
  const [deleting, setDeleting] = useState(false);
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

      // Check if payments exist for this event
      try {
        const paymentsData = await apiClient.getPayments(eventId);
        setHasPayments(paymentsData && paymentsData.length > 0);
      } catch (error) {
        setHasPayments(false);
      }

      // Set edited costs, host, and time to current values
      if (eventData) {
        setEditedButcherCost(eventData.butcher_cost?.toString() || "0");
        setEditedGroceryCost(eventData.grocery_cost?.toString() || "0");
        setEditedHostMemberId(eventData.host_member_id || "");
        // Extract time from event_date (format: YYYY-MM-DD HH:mm or YYYY-MM-DD)
        const eventDate = new Date(eventData.event_date);
        // If event_date doesn't have time, default to 21:00
        let hours = eventDate.getHours();
        let minutes = eventDate.getMinutes();
        // Check if time is 00:00 (likely means no time was set)
        if (hours === 0 && minutes === 0) {
          hours = 21;
          minutes = 0;
        }
        setEditedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }
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
      // Create new attendee only if attended = true (default: אוכל ומשלם)
      const newAttendee: Attendee = {
        id: `temp-${Date.now()}`, // Temporary ID
        event_id: eventId,
        member_id: memberId,
        attended: true,
        pays_with_group: true,
        created_at: new Date().toISOString(),
        member: { id: memberId, name: '', phone: null }
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
          attended: attended,
          pays_with_group: existingAttendee.pays_with_group !== false,
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
              attended: updated.attended !== undefined ? updated.attended : attended,
              pays_with_group: updated.pays_with_group !== undefined ? updated.pays_with_group : a.pays_with_group !== false
            };
          }
          return a;
        }));
      } else if (attended) {
        // Create new attendee
        const created = await apiClient.createAttendee({
          event_id: eventId,
          member_id: memberId,
          attended: true,
          pays_with_group: true
        });
        // Replace temporary ID with real ID
        setAttendees(prev => prev.map(a => 
          a.member_id === memberId ? { ...a, id: created.id, pays_with_group: true } : a
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

  const toggleMemberPaysWithGroup = async (memberId: string, paysWithGroup: boolean) => {
    const existingAttendee = attendees.find(a => a.member_id === memberId);
    if (!existingAttendee || !existingAttendee.attended) return;

    setAttendees(prev => prev.map(a =>
      a.member_id === memberId ? { ...a, pays_with_group: paysWithGroup } : a
    ));

    try {
      const updateData = {
        id: existingAttendee.id,
        event_id: existingAttendee.event_id,
        member_id: existingAttendee.member_id,
        attended: true,
        pays_with_group: paysWithGroup,
        created_at: (existingAttendee as any).created_at
      };
      const updated = await apiClient.updateAttendee(existingAttendee.id, updateData);
      setAttendees(prev => prev.map(a =>
        a.member_id === memberId ? { ...a, ...updated, pays_with_group: updated.pays_with_group !== undefined ? updated.pays_with_group : paysWithGroup } : a
      ));
    } catch (error: any) {
      setAttendees(prev => prev.map(a =>
        a.member_id === memberId ? { ...a, pays_with_group: !paysWithGroup } : a
      ));
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן",
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
      
      // Notify parent to refresh events list
      if (onPaymentsCalculated) {
        onPaymentsCalculated();
      }
      
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

      // Notify parent to refresh events list
      if (onPaymentsCalculated) {
        onPaymentsCalculated();
      }

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

  const updateEventCost = async () => {
    if (!event) return;

    const butcherCost = parseFloat(editedButcherCost);
    const groceryCost = parseFloat(editedGroceryCost);
    
    if (isNaN(butcherCost) || butcherCost < 0 || isNaN(groceryCost) || groceryCost < 0) {
      toast({
        title: "שגיאה",
        description: "אנא הזן סכומים תקינים",
        variant: "destructive"
      });
      return;
    }

    const totalCost = butcherCost + groceryCost;

    try {
      await apiClient.updateEvent(eventId, {
        ...event,
        butcher_cost: butcherCost,
        grocery_cost: groceryCost,
        total_cost: totalCost
      });

      await loadEventDetails();
      setIsEditingCost(false);

      toast({
        title: "הצלחה!",
        description: "הסכומים עודכנו בהצלחה"
      });
    } catch (error: any) {
      console.error("Error updating event cost:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את הסכומים",
        variant: "destructive"
      });
    }
  };

  const updateEventHost = async () => {
    if (!event) return;

    try {
      await apiClient.updateEvent(eventId, {
        ...event,
        host_member_id: editedHostMemberId || null
      });

      await loadEventDetails();
      setIsEditingHost(false);

      toast({
        title: "הצלחה!",
        description: "המארח עודכן בהצלחה"
      });
    } catch (error: any) {
      console.error("Error updating event host:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את המארח",
        variant: "destructive"
      });
    }
  };

  const updateEventTime = async () => {
    if (!event) return;

    try {
      // Parse the event date and update the time
      const eventDate = new Date(event.event_date);
      const [hours, minutes] = editedTime.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Format as YYYY-MM-DD HH:mm
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day} ${editedTime}`;

      await apiClient.updateEvent(eventId, {
        ...event,
        event_date: formattedDateTime
      });

      await loadEventDetails();
      setIsEditingTime(false);
      
      toast({
        title: "הצלחה!",
        description: "שעת האירוע עודכנה בהצלחה"
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את שעת האירוע",
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async () => {
    if (!event) return;

    if (!confirm("האם אתה בטוח שברצונך למחוק את האירוע הזה? פעולה זו לא ניתנת לביטול.")) {
      return;
    }

    try {
      setDeleting(true);
      await apiClient.deleteEvent(eventId);

      toast({
        title: "הצלחה!",
        description: "האירוע נמחק בהצלחה"
      });

      setOpen(false);
      
      // Reload events list by calling onPaymentsCalculated if available
      if (onPaymentsCalculated) {
        onPaymentsCalculated();
      }
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו למחוק את האירוע",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const calculatePayments = async () => {
    if (!event) return;

    try {
      setCalculating(true);

      const payingAttendees = attendees.filter(a => a.attended && (a.pays_with_group !== false));
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

      const totalCost = event.butcher_cost && event.grocery_cost 
        ? event.butcher_cost + event.grocery_cost 
        : (event.total_cost || 0);
      // Use exact value for calculation (no rounding)
      const costPerPerson = totalCost / totalPaying;

      // Get all members to update their balance
      const allMembers = await apiClient.getMembers(groupId);
      
      // Get all existing payments for this event
      const existingPayments = await apiClient.getPayments(eventId);
      
      // If recalculating (hasPayments is true), first return old amounts to balances
      if (hasPayments) {
        // Return old deducted amounts to member balances
        for (const payment of existingPayments) {
          if (payment.payer_type === "member" && payment.payment_status === "deducted") {
            const member = allMembers.find((m: any) => m.id === payment.payer_id);
            if (member) {
              // Get fresh member data
              const freshMembers = await apiClient.getMembers(groupId);
              const freshMember = freshMembers.find((m: any) => m.id === payment.payer_id);
              const currentBalance = freshMember?.balance || member.balance || 0;
              
              // Return the old amount to balance
              // IMPORTANT: Round both values to 2 decimal places before adding to avoid floating point precision issues
              const roundedCurrentBalance = parseFloat((currentBalance || 0).toFixed(2));
              const roundedPaymentAmount = parseFloat((payment.amount || 0).toFixed(2));
              const newBalance = roundedCurrentBalance + roundedPaymentAmount;
              
              // Round only when saving to database (to prevent floating point precision issues)
              // Use parseFloat with toFixed to ensure exactly 2 decimal places
              const roundedNewBalance = parseFloat(newBalance.toFixed(2));
              
              // Update member balance
              await apiClient.updateMember(member.id, {
                ...member,
                balance: roundedNewBalance
              });
            }
          }
        }
        
        // Delete all existing payments for this event
        for (const payment of existingPayments) {
          try {
            await apiClient.deletePayment(payment.id);
          } catch (error) {
            console.error(`Error deleting payment ${payment.id}:`, error);
          }
        }
      }

      // Get fresh members data after returning balances
      const freshMembers = await apiClient.getMembers(groupId);

      // Round costPerPerson once for all members to ensure consistency
      // Use parseFloat with toFixed to ensure exactly 2 decimal places
      const roundedCostPerPerson = parseFloat(costPerPerson.toFixed(2));
      
      // Calculate new payments and deduct from balances
      for (const attendee of payingAttendees) {
        const member = freshMembers.find((m: any) => m.id === attendee.member_id);
        
        if (member) {
          // Get current balance and ensure it's a number
          // IMPORTANT: Round to 2 decimal places before calculation to avoid floating point precision issues
          const currentBalance = typeof member.balance === 'string' 
            ? parseFloat(member.balance) 
            : (member.balance || 0);
          const roundedCurrentBalance = parseFloat(currentBalance.toFixed(2));
          
          // Calculate new balance (deduct rounded costPerPerson). מינוס = חבר חרג, חייב להשלים
          const newBalance = roundedCurrentBalance - roundedCostPerPerson;
          
          // Round only when saving to database (to prevent floating point precision issues)
          // Use parseFloat with toFixed to ensure exactly 2 decimal places
          const roundedNewBalance = parseFloat(newBalance.toFixed(2));
          
          // Update member balance
          await apiClient.updateMember(member.id, {
            ...member,
            balance: roundedNewBalance
          });

          // Create new payment record (round only when saving)
          // IMPORTANT: Use the same rounded value for payment amount
          await apiClient.createPayment({
            event_id: eventId,
            payer_id: attendee.member_id,
            payer_type: "member",
            amount: roundedCostPerPerson,
            payment_status: "deducted" // Mark as deducted from balance
          });
        }
      }

      // Create payments for guests (round only when saving to database)
      // Use the same rounded value as for members to ensure consistency
      for (const guest of payingGuests) {
        await apiClient.createPayment({
          event_id: eventId,
          payer_id: guest.id,
          payer_type: "guest",
          amount: roundedCostPerPerson,
          payment_status: "pending"
        });
      }

      // Mark that payments have been calculated
      setHasPayments(true);

      toast({
        title: "הצלחה!",
        description: `חושבו תשלומים: ${costPerPerson.toFixed(2)} ₪ לכל משתתף. הסכום נקזז מהיתרה החודשית של כל חבר`
      });

      // Reload event details to show updated payments
      await loadEventDetails();

      // Navigate to payments tab (but keep dialog open)
      if (onPaymentsCalculated) {
        onPaymentsCalculated();
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
  const payingAttendees = attendees.filter(a => a.attended && (a.pays_with_group !== false));
  const payingGuests = guests.filter(g => g.should_pay);
  const totalPaying = payingAttendees.length + payingGuests.length;
  const totalCost = event ? (event.butcher_cost || 0) + (event.grocery_cost || 0) : (event?.total_cost || 0);
  const costPerPerson = totalPaying > 0 && totalCost > 0 ? totalCost / totalPaying : 0;
  
  // Check if event is in the future or past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDateOnly = event ? new Date(event.event_date) : new Date();
  eventDateOnly.setHours(0, 0, 0, 0);
  const isFutureEvent = eventDateOnly >= today;
  const attendanceLabel = isFutureEvent ? "מגיע" : "הגיע";

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
        
        {/* Time Editor */}
        {!isEditingTime && event && (
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-sm text-muted-foreground">
              שעה: {format(eventDate, "HH:mm", { locale: he })}
            </span>
            {isAdmin && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingTime(true);
                  const eventDate = new Date(event.event_date);
                  const hours = String(eventDate.getHours()).padStart(2, '0');
                  const minutes = String(eventDate.getMinutes()).padStart(2, '0');
                  setEditedTime(`${hours}:${minutes}`);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
        {isEditingTime && isAdmin && (
          <div className="flex items-center justify-end gap-2 mb-4">
            <Input
              type="time"
              value={editedTime}
              onChange={(e) => setEditedTime(e.target.value)}
              className="w-32 text-right"
              dir="rtl"
            />
            <Button
              type="button"
              size="sm"
              onClick={updateEventTime}
            >
              <Save className="w-3 h-3 ml-1" />
              שמור
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingTime(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Location/Host Editor */}
        {!isEditingHost && (event?.host_member_id && members.length > 0 ? (() => {
          const hostMember = members.find(m => m.id === event.host_member_id);
          return hostMember ? (
            <div className="flex items-center justify-end gap-2 mb-4">
              <span className="text-sm text-muted-foreground">מיקום: {hostMember.name}</span>
              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingHost(true);
                    setEditedHostMemberId(event.host_member_id || "");
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ) : null;
        })() : (
          event && isAdmin && (
            <div className="flex items-center justify-end gap-2 mb-4">
              <span className="text-sm text-muted-foreground">אין מיקום מוגדר</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingHost(true);
                  setEditedHostMemberId("");
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )
        ))}
        {isEditingHost && isAdmin && (
          <div className="flex items-center justify-end gap-2 mb-4">
              <Select value={editedHostMemberId || "none"} onValueChange={(value) => setEditedHostMemberId(value === "none" ? "" : value)}>
                <SelectTrigger className="w-48 text-right" dir="rtl">
                  <SelectValue placeholder="בחר מארח" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="none" className="text-right">אין מארח</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="text-right">
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditingHost(false);
                setEditedHostMemberId(event?.host_member_id || "");
              }}
            >
              <X className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={updateEventHost}
            >
              <Save className="w-3 h-3 ml-1" />
              שמור
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">טוען...</div>
        ) : !event ? (
          <div className="text-center py-8">לא הצלחנו לטעון את פרטי האירוע</div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-4">
              {isAdmin && (
                <div className="flex items-center justify-end gap-2">
                  {isEditingCost ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingCost(false);
                          setEditedButcherCost(event.butcher_cost?.toString() || "0");
                          setEditedGroceryCost(event.grocery_cost?.toString() || "0");
                        }}
                      >
                        <X className="w-4 h-4 ml-2" />
                        ביטול
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={updateEventCost}
                      >
                        <Save className="w-4 h-4 ml-2" />
                        שמור
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingCost(true)}
                    >
                      <Edit2 className="w-4 h-4 ml-2" />
                      ערוך סכומים
                    </Button>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {isEditingCost && isAdmin ? (
                  <>
                    <div className="text-right">
                      <Label className="text-sm text-muted-foreground mb-2 block">קצבייה</Label>
                      <Input
                        type="number"
                        value={editedButcherCost}
                        onChange={(e) => setEditedButcherCost(e.target.value)}
                        className="text-right text-xl font-bold"
                        dir="rtl"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    <div className="text-right">
                      <Label className="text-sm text-muted-foreground mb-2 block">סופר</Label>
                      <Input
                        type="number"
                        value={editedGroceryCost}
                        onChange={(e) => setEditedGroceryCost(e.target.value)}
                        className="text-right text-xl font-bold"
                        dir="rtl"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">קצבייה</div>
                      <div className="text-xl font-bold">{(event.butcher_cost || 0).toFixed(2)} ₪</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">סופר</div>
                      <div className="text-xl font-bold">{(event.grocery_cost || 0).toFixed(2)} ₪</div>
                    </div>
                  </>
                )}
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">משלמים</div>
                    <div className="text-2xl font-bold">{totalPaying}</div>
                    {totalPaying > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {costPerPerson.toFixed(2)} ₪ לאדם
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">סה״כ</div>
                    <div className="text-2xl font-bold">{totalCost.toFixed(2)} ₪</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Members */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                חברים קבועים
              </h3>
              <div className="space-y-2">
                {(() => {
                  // Get current user phone
                  const savedUser = localStorage.getItem('bbq_current_user');
                  const userPhone = savedUser ? JSON.parse(savedUser).phone : null;
                  
                  // Sort members: current user first, then by attendance status (attended first), then alphabetically
                  const sortedMembers = [...members].sort((a, b) => {
                    const aAttendee = attendees.find(att => att.member_id === a.id);
                    const bAttendee = attendees.find(att => att.member_id === b.id);
                    const aAttended = aAttendee?.attended || false;
                    const bAttended = bAttendee?.attended || false;
                    const aIsCurrentUser = a.phone === userPhone;
                    const bIsCurrentUser = b.phone === userPhone;
                    
                    // Current user always first
                    if (aIsCurrentUser && !bIsCurrentUser) return -1;
                    if (!aIsCurrentUser && bIsCurrentUser) return 1;
                    
                    // If both are current user or both are not, sort by attendance
                    if (aAttended && !bAttended) return -1;
                    if (!aAttended && bAttended) return 1;
                    
                    // If same attendance status, sort alphabetically
                    return a.name.localeCompare(b.name, 'he');
                  });
                  
                  return sortedMembers.map((member) => {
                    const attendee = attendees.find(a => a.member_id === member.id);
                    const attended = attendee?.attended || false;
                    const paysWithGroup = attendee?.pays_with_group !== false;
                    const isCurrentUser = member.phone === userPhone;
                    
                    // Only allow editing if admin or if it's the current user
                    const canEdit = isAdmin || isCurrentUser;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {attended ? (
                            <Badge variant="default">
                              <CheckCircle2 className="w-3 h-3 ml-1" />
                              {attendanceLabel}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 ml-1" />
                              לא מגיע
                            </Badge>
                          )}
                          {attended && (
                            canEdit ? (
                              <Toggle
                                type="button"
                                pressed={paysWithGroup}
                                onPressedChange={(pressed) => toggleMemberPaysWithGroup(member.id, pressed)}
                                variant={paysWithGroup ? "default" : "outline"}
                                size="sm"
                                className="min-w-[100px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {paysWithGroup ? "אוכל ומשלם" : "קונה לעצמו"}
                              </Toggle>
                            ) : (
                              <Badge variant={paysWithGroup ? "default" : "secondary"}>
                                {paysWithGroup ? "אוכל ומשלם" : "קונה לעצמו"}
                              </Badge>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={attended}
                            disabled={!canEdit}
                            onCheckedChange={(checked) =>
                              toggleMemberAttendance(member.id, checked as boolean)
                            }
                          />
                          <div className="flex flex-col items-end min-w-0">
                            <span className={`text-right ${attended ? "font-medium" : "text-muted-foreground"}`}>
                              {member.name}
                              {isCurrentUser && !isAdmin && (
                                <span className="text-xs text-muted-foreground ml-2">(אתה)</span>
                              )}
                            </span>
                            {member.nickname && (
                              <span className="text-muted-foreground text-sm font-normal">
                                {member.nickname}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
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
                      <div className="flex items-center gap-3">
                        {guestAttended && (
                          <Badge variant="default">
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            {attendanceLabel}
                          </Badge>
                        )}
                        {isAdmin && (
                          <div className="flex items-center gap-2 border-l pl-3">
                            <Toggle
                              pressed={guest.should_pay}
                              onPressedChange={(pressed) => toggleGuestPaymentStatus(guest.id, pressed)}
                              variant={guest.should_pay ? "default" : "outline"}
                              size="sm"
                              className="min-w-[80px]"
                            >
                              {guest.should_pay ? "משלם" : "חינם"}
                            </Toggle>
                          </div>
                        )}
                        {!isAdmin && (
                          <Badge variant={guest.should_pay ? "default" : "secondary"}>
                            {guest.should_pay ? "משלם" : "חינם"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={guestAttended}
                          disabled={!isAdmin}
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
                    </div>
                  );
                })}
              </div>

              {/* Add Guest - Only for admin */}
              {isAdmin && (
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
              )}
            </div>

            <Separator />

            {/* Actions - Only for admin */}
            {isAdmin && (
            <div className="flex justify-start gap-2">
              <Button
                onClick={calculatePayments}
                disabled={calculating || totalPaying === 0}
                className="flex-1"
                variant={hasPayments ? "outline" : "default"}
              >
                {calculating 
                  ? "מחשב..." 
                  : hasPayments 
                    ? "חשב מחדש תשלומים" 
                    : "חשב תשלומים"}
              </Button>
              <Button
                onClick={deleteEvent}
                disabled={deleting}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                {deleting ? "מוחק..." : "מחק אירוע"}
              </Button>
            </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;
