import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, ChevronLeft, Clock, History, CheckCircle2, XCircle, MapPin, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import EventDetailsDialog from "./EventDetailsDialog";
import { EventPayboxMarkControl } from "./EventPayboxMarkControl";

interface Event {
  id: string;
  event_date: string;
  total_cost?: number;
  butcher_cost?: number;
  grocery_cost?: number;
  paybox_cash_out?: number | null;
  description: string | null;
  host_member_id?: string | null;
  created_at: string;
}

interface EventsListProps {
  groupId: string;
  userId: string;
  isAdmin: boolean;
  showHistory?: boolean;
  onPaymentsCalculated?: () => void;
  /** When this value changes, the list refetches (e.g. after creating a new event). */
  externalRefreshTrigger?: number;
}

const EventsList = ({ groupId, userId, isAdmin, showHistory = false, onPaymentsCalculated, externalRefreshTrigger }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, isAdmin, userId, refreshTrigger, externalRefreshTrigger]);

  // Create a wrapper callback that refreshes events list
  const handlePaymentsCalculated = () => {
    setRefreshTrigger(prev => prev + 1);
    if (onPaymentsCalculated) {
      onPaymentsCalculated();
    }
  };
  const handleEventDetailsClose = () => setRefreshTrigger(prev => prev + 1);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await apiClient.getEvents(groupId);
      
      const isAdminUser = isAdmin === true;
      
      if (isAdminUser) {
        setEvents(allEvents);
        setLoading(false);
        return;
      }
      
      const savedUser = localStorage.getItem('bbq_current_user');
      const userPhone = savedUser ? JSON.parse(savedUser).phone : null;
      const members = await apiClient.getMembers(groupId);
      const userMember = members.find((m: any) => m.phone === userPhone);
      
      if (!userMember) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureEvents = allEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });
        setEvents(futureEvents);
        return;
      }
      
      const userMemberId = userMember.id;
      const filteredEvents = await Promise.all(
        allEvents.map(async (event) => {
          const eventDate = new Date(event.event_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          
          if (eventDate >= today) {
            return event;
          }
          
          try {
            const attendees = await apiClient.getAttendees(event.id);
            const userAttended = attendees.some((a: any) => a.member_id === userMemberId && a.attended);
            return userAttended ? event : null;
          } catch (error) {
            console.error(`Error checking attendees for event ${event.id}:`, error);
            return null;
          }
        })
      );
      
      const finalEvents = filteredEvents.filter(e => e !== null) as Event[];
      setEvents(finalEvents);
    } catch (error: any) {
      console.error("Error loading events:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את האירועים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען אירועים...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border-2 shadow-md">
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Calendar className="w-12 h-12 text-primary opacity-50" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">עדיין אין אירועים</h3>
              <p className="text-muted-foreground">צור אירוע ראשון כדי להתחיל!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureEvents = events
    .filter(event => {
      const eventDate = new Date(event.event_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  
  const pastEvents = events
    .filter(event => {
      const eventDate = new Date(event.event_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    })
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="space-y-8 pb-20 md:pb-6 w-full" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      {/* Future Events */}
      {futureEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6" dir="rtl" style={{ direction: "rtl" }}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold">אירועים קרובים</h2>
            <Badge variant="default" className="text-sm px-3 py-1 bg-primary text-white hover:bg-primary">{futureEvents.length}</Badge>
          </div>
          <div className="space-y-4">
            {futureEvents.map((event, index) => (
              <EventCard 
                key={event.id}
                event={event}
                groupId={groupId}
                userId={userId}
                isAdmin={isAdmin}
                onPaymentsCalculated={handlePaymentsCalculated}
                onEventDetailsClose={handleEventDetailsClose}
                index={index}
                isFuture={true}
                refreshTrigger={refreshTrigger}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6" dir="rtl" style={{ direction: "rtl" }}>
            <div className="p-2 rounded-lg bg-gray-500/10">
              <History className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold">אירועים שעברו</h2>
            <Badge variant="secondary" className="text-sm px-3 py-1 bg-green-800 text-white hover:bg-green-900">{pastEvents.length}</Badge>
          </div>
          <div className="space-y-4">
            {pastEvents.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                groupId={groupId}
                userId={userId}
                isAdmin={isAdmin}
                onPaymentsCalculated={handlePaymentsCalculated}
                onEventDetailsClose={handleEventDetailsClose}
                index={index}
                isFuture={false}
                refreshTrigger={refreshTrigger}
              />
            ))}
          </div>
        </div>
      )}

      {futureEvents.length === 0 && pastEvents.length === 0 && (
        <Card className="border-2 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Calendar className="w-12 h-12 text-primary opacity-50" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">עדיין אין אירועים</h3>
                <p className="text-muted-foreground">צור אירוע ראשון כדי להתחיל!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const STAT_TONES = {
  green: { box: "bg-emerald-500/10", dot: "bg-emerald-500", text: "text-emerald-700" },
  teal: { box: "bg-teal-500/10", dot: "bg-teal-500", text: "text-teal-700" },
  blue: { box: "bg-blue-500/10", dot: "bg-blue-500", text: "text-blue-700" },
  orange: { box: "bg-orange-500/10", dot: "bg-orange-500", text: "text-orange-700" },
  purple: { box: "bg-violet-500/10", dot: "bg-violet-500", text: "text-violet-700" },
  pink: { box: "bg-pink-500/10", dot: "bg-pink-500", text: "text-pink-700" },
} as const;

/** One colored stat: an icon in a colored circle, a small label and the value. */
function EventStat({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: keyof typeof STAT_TONES;
  icon: React.ReactElement;
  label: string;
  value: string;
  sub?: string;
}) {
  const t = STAT_TONES[tone];
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 text-center sm:flex-row sm:gap-2 sm:py-1.5 sm:pl-3 sm:pr-1.5 sm:text-right ${t.box}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm sm:h-7 sm:w-7 ${t.dot} [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-3.5 sm:[&>svg]:w-3.5`}>
        {icon}
      </span>
      <div className="flex min-w-0 max-w-full flex-col leading-tight">
        <span dir="auto" className={`truncate text-[15px] font-bold tabular-nums sm:order-2 sm:max-w-[130px] sm:text-sm ${t.text}`}>{value}</span>
        <span className="truncate text-[11px] text-muted-foreground sm:order-1">{label}</span>
        {sub && <span dir="auto" className="truncate text-[10px] text-muted-foreground sm:order-3">{sub}</span>}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  groupId: string;
  userId: string;
  isAdmin: boolean;
  onPaymentsCalculated?: () => void;
  onEventDetailsClose?: () => void;
  index: number;
  isFuture: boolean;
  refreshTrigger?: number;
}

const EventCard = ({ event, groupId, userId, isAdmin, onPaymentsCalculated, onEventDetailsClose, index, isFuture, refreshTrigger }: EventCardProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [userMember, setUserMember] = useState<any>(null);
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [payingCount, setPayingCount] = useState<number>(0);
  const [costFull, setCostFull] = useState<number>(0);
  const [costGroceryOnly, setCostGroceryOnly] = useState<number>(0);
  const [hasBothPaymentTypes, setHasBothPaymentTypes] = useState<boolean>(false);
  const [fullPayersCount, setFullPayersCount] = useState<number>(0);
  const [groceryOnlyPayersCount, setGroceryOnlyPayersCount] = useState<number>(0);
  const { toast } = useToast();
  const eventDate = new Date(event.event_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDateOnly = new Date(eventDate);
  eventDateOnly.setHours(0, 0, 0, 0);
  const isPast = eventDateOnly < today;

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const membersData = await apiClient.getMembers(groupId);
        const activeMembers = membersData.filter(m => m.is_active !== false);
        setMembers(activeMembers);
        
        const savedUser = localStorage.getItem('bbq_current_user');
        const userPhone = savedUser ? JSON.parse(savedUser).phone : null;
        const currentUserMember = activeMembers.find((m: any) => m.phone === userPhone);
        setUserMember(currentUserMember);
        
        if (isFuture && currentUserMember) {
          try {
            const attendees = await apiClient.getAttendees(event.id);
            const userAttendee = attendees.find((a: any) => a.member_id === currentUserMember.id);
            setIsAttending(userAttendee ? userAttendee.attended : false);
          } catch (error) {
            console.error("Error loading attendance:", error);
            setIsAttending(false);
          }
        }
        
        try {
          const attendees = await apiClient.getAttendees(event.id);
          const confirmedAttendees = attendees.filter((a: any) => a.attended === true).length;
          const payingAttendeesList = attendees.filter((a: any) => a.attended && (a.pays_with_group !== false));
          const payingAttendees = payingAttendeesList.length;
          const fullPayersCount = payingAttendeesList.filter((a: any) => !(a.pays_grocery_only === true)).length;
          const hasGroceryOnly = payingAttendeesList.some((a: any) => a.pays_grocery_only === true);
          try {
            const guests = await apiClient.getGuests(event.id);
            const payingGuests = guests.filter((g: any) => g.should_pay === true).length;
            setConfirmedCount(confirmedAttendees + payingGuests);
            setPayingCount(payingAttendees + payingGuests);
            const nFull = fullPayersCount + payingGuests;
            const nAll = payingAttendees + payingGuests;
            const butcher = event.butcher_cost ?? 0;
            const grocery = event.grocery_cost ?? 0;
            if (nAll > 0) {
              setCostGroceryOnly(grocery / nAll);
              setCostFull(nFull > 0 ? butcher / nFull + grocery / nAll : (butcher + grocery) / nAll);
            } else {
              setCostFull(0);
              setCostGroceryOnly(0);
            }
            setHasBothPaymentTypes(hasGroceryOnly && fullPayersCount > 0);
            const groceryOnlyCount = payingAttendeesList.filter((a: any) => a.pays_grocery_only === true).length;
            setFullPayersCount(fullPayersCount + payingGuests);
            setGroceryOnlyPayersCount(groceryOnlyCount);
          } catch (guestError) {
            console.error("Error loading guests:", guestError);
            setConfirmedCount(confirmedAttendees);
            setPayingCount(payingAttendees);
            const nAll = payingAttendees;
            const nFull = fullPayersCount;
            const groceryOnlyCount = payingAttendeesList.filter((a: any) => a.pays_grocery_only === true).length;
            setFullPayersCount(fullPayersCount);
            setGroceryOnlyPayersCount(groceryOnlyCount);
            const butcher = event.butcher_cost ?? 0;
            const grocery = event.grocery_cost ?? 0;
            if (nAll > 0) {
              setCostGroceryOnly(grocery / nAll);
              setCostFull(nFull > 0 ? butcher / nFull + grocery / nAll : (butcher + grocery) / nAll);
            }
            setHasBothPaymentTypes(hasGroceryOnly && fullPayersCount > 0);
          }
        } catch (error) {
          console.error("Error loading confirmed attendees:", error);
          setConfirmedCount(0);
          setPayingCount(0);
          setCostFull(0);
          setCostGroceryOnly(0);
          setHasBothPaymentTypes(false);
          setFullPayersCount(0);
          setGroceryOnlyPayersCount(0);
        }
      } catch (error) {
        console.error("Error loading members:", error);
      }
    };
    loadMembers();
  }, [groupId, event.id, isFuture, refreshTrigger]);

  const handleToggleAttendance = async (attended: boolean) => {
    if (!userMember || loadingAttendance) return;
    
    setLoadingAttendance(true);
    setIsAttending(attended);
    
    try {
      const attendees = await apiClient.getAttendees(event.id);
      const existingAttendee = attendees.find((a: any) => a.member_id === userMember.id);
      
      if (existingAttendee) {
        const updateData = {
          id: existingAttendee.id,
          event_id: existingAttendee.event_id,
          member_id: existingAttendee.member_id,
          attended: attended,
          pays_with_group: existingAttendee.pays_with_group !== false,
          pays_grocery_only: existingAttendee.pays_grocery_only === true,
          created_at: existingAttendee.created_at
        };
        await apiClient.updateAttendee(existingAttendee.id, updateData);
      } else if (attended) {
        await apiClient.createAttendee({
          event_id: event.id,
          member_id: userMember.id,
          attended: true,
          pays_with_group: true,
          pays_grocery_only: false
        });
      }
      
      try {
        const attendees = await apiClient.getAttendees(event.id);
        const confirmedAttendees = attendees.filter((a: any) => a.attended === true).length;
        const payingAttendeesList = attendees.filter((a: any) => a.attended && (a.pays_with_group !== false));
        const payingAttendees = payingAttendeesList.length;
        const fullPayersCount = payingAttendeesList.filter((a: any) => !(a.pays_grocery_only === true)).length;
        const hasGroceryOnly = payingAttendeesList.some((a: any) => a.pays_grocery_only === true);
        try {
          const guests = await apiClient.getGuests(event.id);
          const payingGuests = guests.filter((g: any) => g.should_pay === true).length;
          setConfirmedCount(confirmedAttendees + payingGuests);
          setPayingCount(payingAttendees + payingGuests);
          const nFull = fullPayersCount + payingGuests;
          const nAll = payingAttendees + payingGuests;
          const butcher = event.butcher_cost ?? 0;
          const grocery = event.grocery_cost ?? 0;
          if (nAll > 0) {
            setCostGroceryOnly(grocery / nAll);
            setCostFull(nFull > 0 ? butcher / nFull + grocery / nAll : (butcher + grocery) / nAll);
          }
          setHasBothPaymentTypes(hasGroceryOnly && fullPayersCount > 0);
          const groceryOnlyCount = payingAttendeesList.filter((a: any) => a.pays_grocery_only === true).length;
          setFullPayersCount(fullPayersCount + payingGuests);
          setGroceryOnlyPayersCount(groceryOnlyCount);
        } catch (guestError) {
          console.error("Error loading guests:", guestError);
          setConfirmedCount(confirmedAttendees);
          setPayingCount(payingAttendees);
          const nAll = payingAttendees;
          const nFull = fullPayersCount;
          const butcher = event.butcher_cost ?? 0;
          const grocery = event.grocery_cost ?? 0;
          if (nAll > 0) {
            setCostGroceryOnly(grocery / nAll);
            setCostFull(nFull > 0 ? butcher / nFull + grocery / nAll : (butcher + grocery) / nAll);
          }
          setHasBothPaymentTypes(hasGroceryOnly && fullPayersCount > 0);
          const groceryOnlyCount = payingAttendeesList.filter((a: any) => a.pays_grocery_only === true).length;
          setFullPayersCount(fullPayersCount);
          setGroceryOnlyPayersCount(groceryOnlyCount);
        }
      } catch (error) {
        console.error("Error refreshing confirmed count:", error);
      }
      
      toast({
        title: attended ? "נרשמת לאירוע" : "ביטלת את ההרשמה",
        description: attended ? "אתה מסומן כמגיע לאירוע" : "אתה לא מסומן כמגיע לאירוע",
      });
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      setIsAttending(!attended);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את ההגעה",
        variant: "destructive"
      });
    } finally {
      setLoadingAttendance(false);
    }
  };

  const hostMember = event.host_member_id ? members.find(m => m.id === event.host_member_id) : null;
  const totalCost = (event.butcher_cost || 0) + (event.grocery_cost || 0) || (event.total_cost || 0);

  return (
    <Card className={`w-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md ${isFuture ? "border-primary/40" : ""}`} dir="rtl">
      <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Date block */}
        <div
          className={`flex h-[72px] w-16 shrink-0 flex-col items-center justify-center rounded-xl text-center sm:h-20 sm:w-20 ${
            isFuture ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          <span className="text-[11px] leading-none opacity-80">{format(eventDate, "EEEE", { locale: he })}</span>
          <span className="bbq-display text-3xl font-extrabold leading-tight">{format(eventDate, "d")}</span>
          <span className="text-xs leading-none opacity-80">{format(eventDate, "MMM yy", { locale: he })}</span>
        </div>

        {/* What */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="truncate text-base font-bold sm:text-lg">{event.description?.trim() || "מפגש"}</div>
          <div className="text-sm text-muted-foreground">{format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}</div>
        </div>
      </div>

      {/* Colored stats: a 3-column tile grid on phones, a row of pills from sm up */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <EventStat tone="green" icon={<Users />} label="מגיעים" value={String(confirmedCount)} />
          <EventStat
            tone="teal"
            icon={<Coins />}
            label="משלמים"
            value={String(payingCount)}
            sub={hasBothPaymentTypes ? `${fullPayersCount} הכל · ${groceryOnlyPayersCount} סופר` : undefined}
          />
          <EventStat tone="blue" icon={<Coins />} label="עלות כוללת" value={`${totalCost.toFixed(0)} ₪`} />
          <EventStat
            tone="orange"
            icon={<Coins />}
            label="למשתתף"
            value={payingCount > 0 && totalCost > 0 ? `${costFull.toFixed(2)} ₪` : "—"}
            sub={payingCount > 0 && hasBothPaymentTypes ? `סופר ${costGroceryOnly.toFixed(2)} ₪` : undefined}
          />
          <EventStat tone="purple" icon={<Clock />} label="שעה" value={format(eventDate, "HH:mm", { locale: he })} />
          <EventStat tone="pink" icon={<MapPin />} label="מיקום" value={hostMember ? hostMember.name : "—"} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {isFuture && !isAdmin && userMember && (
            <Toggle
              pressed={isAttending === true}
              onPressedChange={(pressed) => handleToggleAttendance(pressed)}
              disabled={loadingAttendance || isAttending === null}
              className={`h-8 gap-1 rounded-full px-3 text-xs ${
                isAttending
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 data-[state=on]:bg-emerald-100"
                  : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"
              }`}
              aria-label={isAttending ? "מגיע" : "לא מגיע"}
            >
              {isAttending ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              <span className="font-medium">{isAttending ? "אני מגיע/ה" : "לא מגיע/ה"}</span>
            </Toggle>
          )}
          {isAdmin && isPast && totalCost > 0 && (
            <EventPayboxMarkControl event={event} compact onUpdated={() => onEventDetailsClose?.()} />
          )}
        </div>
        <EventDetailsDialog
          eventId={event.id}
          groupId={groupId}
          userId={userId}
          isAdmin={isAdmin}
          onPaymentsCalculated={onPaymentsCalculated}
          onClose={onEventDetailsClose}
        >
          <Button variant={isFuture ? "default" : "outline"} size="sm" className="h-8 rounded-full px-4" type="button">
            פרטים
            <ChevronLeft className="mr-1 h-4 w-4" />
          </Button>
        </EventDetailsDialog>
      </div>
    </Card>
  );
};

export default EventsList;
