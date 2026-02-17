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

interface Event {
  id: string;
  event_date: string;
  total_cost?: number;
  butcher_cost?: number;
  grocery_cost?: number;
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
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold">אירועים קרובים</h2>
            <Badge variant="default" className="text-sm px-3 py-1 bg-blue-600 text-white hover:bg-blue-700">{futureEvents.length}</Badge>
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

interface EventCardProps {
  event: Event;
  groupId: string;
  userId: string;
  isAdmin: boolean;
  onPaymentsCalculated?: () => void;
  index: number;
  isFuture: boolean;
  refreshTrigger?: number;
}

const EventCard = ({ event, groupId, userId, isAdmin, onPaymentsCalculated, index, isFuture, refreshTrigger }: EventCardProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [userMember, setUserMember] = useState<any>(null);
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [payingCount, setPayingCount] = useState<number>(0);
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
          const payingAttendees = attendees.filter((a: any) => a.attended && (a.pays_with_group !== false)).length;
          try {
            const guests = await apiClient.getGuests(event.id);
            const payingGuests = guests.filter((g: any) => g.should_pay === true).length;
            setConfirmedCount(confirmedAttendees + payingGuests);
            setPayingCount(payingAttendees + payingGuests);
          } catch (guestError) {
            console.error("Error loading guests:", guestError);
            setConfirmedCount(confirmedAttendees);
            setPayingCount(payingAttendees);
          }
        } catch (error) {
          console.error("Error loading confirmed attendees:", error);
          setConfirmedCount(0);
          setPayingCount(0);
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
          created_at: existingAttendee.created_at
        };
        await apiClient.updateAttendee(existingAttendee.id, updateData);
      } else if (attended) {
        await apiClient.createAttendee({
          event_id: event.id,
          member_id: userMember.id,
          attended: true,
          pays_with_group: true
        });
      }
      
      try {
        const attendees = await apiClient.getAttendees(event.id);
        const confirmedAttendees = attendees.filter((a: any) => a.attended === true).length;
        const payingAttendees = attendees.filter((a: any) => a.attended && (a.pays_with_group !== false)).length;
        try {
          const guests = await apiClient.getGuests(event.id);
          const payingGuests = guests.filter((g: any) => g.should_pay === true).length;
          setConfirmedCount(confirmedAttendees + payingGuests);
          setPayingCount(payingAttendees + payingGuests);
        } catch (guestError) {
          console.error("Error loading guests:", guestError);
          setConfirmedCount(confirmedAttendees);
          setPayingCount(payingAttendees);
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
    <Card className={`w-full relative overflow-hidden border shadow-md hover:shadow-lg transition-all duration-200 ${isFuture ? 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`} dir="rtl">
      {/* Top accent bar */}
      <div className={`absolute top-0 right-0 w-full h-1 ${isFuture ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4" dir="rtl" style={{ direction: "rtl" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded ${isFuture ? 'bg-blue-100 dark:bg-blue-950/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Calendar className={`w-4 h-4 ${isFuture ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-xl font-bold truncate">
                  {format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}
                </CardTitle>
              </div>
            </div>
            
            {event.description && (
              <CardDescription className="mt-2 text-sm text-right line-clamp-2">
                {event.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        {/* Bottom row: Stats and Actions */}
        <div
          dir="rtl"
          className="w-full flex flex-col gap-3 items-end sm:flex-row sm:items-center sm:justify-between sm:gap-2"
        >
          {/* Stats (משמאל בדסקטופ) */}
          <div className="flex flex-wrap justify-start gap-2 w-full sm:w-auto sm:order-2" dir="rtl" style={{ direction: "rtl" }}>
            {/* Attendance toggle */}
            {isFuture && !isAdmin && userMember && (
              <Toggle
                pressed={isAttending === true}
                onPressedChange={(pressed) => handleToggleAttendance(pressed)}
                disabled={loadingAttendance || isAttending === null}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs h-auto ${
                  isAttending
                    ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-950/50"
                    : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50"
                }`}
                aria-label={isAttending ? "מגיע" : "לא מגיע"}
              >
                {isAttending ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="font-medium">מגיע</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span className="font-medium">לא מגיע</span>
                  </>
                )}
              </Toggle>
            )}

            {/* Confirmed */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${isFuture ? "bg-green-100/80 dark:bg-green-950/30 border-green-200 dark:border-green-800/50" : "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/40"}`}>
              <Users className={`w-3.5 h-3.5 ${isFuture ? "text-green-600" : "text-green-600/80"}`} />
              <div className="flex flex-col items-end">
                <span className={`text-[10px] leading-tight ${isFuture ? "text-green-600/90" : "text-green-700/70"}`}>מאשרים</span>
                <span className={`text-xs font-bold ${isFuture ? "text-green-800 dark:text-green-300" : "text-green-700 dark:text-green-400"}`}>
                  {confirmedCount}
                </span>
              </div>
            </div>

            {/* Paying */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${isFuture ? "bg-teal-100/80 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/50" : "bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/40"}`}>
              <Coins className={`w-3.5 h-3.5 ${isFuture ? "text-teal-600" : "text-teal-600/80"}`} />
              <div className="flex flex-col items-end">
                <span className={`text-[10px] leading-tight ${isFuture ? "text-teal-600/90" : "text-teal-700/70"}`}>משלמים</span>
                <span className={`text-xs font-bold ${isFuture ? "text-teal-800 dark:text-teal-300" : "text-teal-700 dark:text-teal-400"}`}>
                  {payingCount}
                </span>
              </div>
            </div>

            {/* Total Cost */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${isFuture ? "bg-sky-100/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50" : "bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/40"}`}>
              <Coins className={`w-3.5 h-3.5 ${isFuture ? "text-sky-600" : "text-sky-600/80"}`} />
              <div className="flex flex-col items-end">
                <span className={`text-[10px] leading-tight ${isFuture ? "text-sky-600/90" : "text-sky-700/70"}`}>עלות סה"כ</span>
                <span className={`text-xs font-bold ${isFuture ? "text-sky-800 dark:text-sky-300" : "text-sky-700 dark:text-sky-400"}`}>
                  {totalCost.toFixed(2)} ₪
                </span>
              </div>
            </div>

            {/* Cost Per Person (per paying participant) */}
            {payingCount > 0 && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${isFuture ? "bg-amber-100/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50" : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"}`}>
                <Coins className={`w-3.5 h-3.5 ${isFuture ? "text-amber-600" : "text-amber-600/80"}`} />
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] leading-tight ${isFuture ? "text-amber-600/90" : "text-amber-700/70"}`}>עלות למשתתף</span>
                  <span className={`text-xs font-bold ${isFuture ? "text-amber-800 dark:text-amber-300" : "text-amber-700 dark:text-amber-400"}`}>
                    {(totalCost / payingCount).toFixed(2)} ₪
                  </span>
                </div>
              </div>
            )}

            {/* Time */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${isFuture ? "bg-violet-100/80 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50" : "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40"}`}>
              <Clock className={`w-3.5 h-3.5 ${isFuture ? "text-violet-600" : "text-violet-600/80"}`} />
              <div className="flex flex-col items-end">
                <span className={`text-[10px] leading-tight ${isFuture ? "text-violet-600/90" : "text-violet-700/70"}`}>שעה</span>
                <span className={`text-xs font-bold ${isFuture ? "text-violet-800 dark:text-violet-300" : "text-violet-700 dark:text-violet-400"}`}>
                  {format(eventDate, "HH:mm", { locale: he })}
                </span>
              </div>
            </div>

            {/* Location */}
            {hostMember && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${isFuture ? "bg-rose-100/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50" : "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40"}`}>
                <MapPin className={`w-3.5 h-3.5 ${isFuture ? "text-rose-600" : "text-rose-600/80"}`} />
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] leading-tight ${isFuture ? "text-rose-600/90" : "text-rose-700/70"}`}>מיקום</span>
                  <span className={`text-xs font-bold truncate max-w-[100px] ${isFuture ? "text-rose-800 dark:text-rose-300" : "text-rose-700 dark:text-rose-400"}`}>
                    {hostMember.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Button (מימין בדסקטופ) */}
          <div className="self-end sm:self-auto sm:order-1">
            <EventDetailsDialog
              eventId={event.id}
              groupId={groupId}
              userId={userId}
              isAdmin={isAdmin}
              onPaymentsCalculated={onPaymentsCalculated}
            >
              <Button
                variant="default"
                size="sm"
                className={`min-w-[80px] h-7 text-xs px-3 ${isFuture ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                type="button"
              >
                <ChevronLeft className="w-3 h-3 ml-1" />
                פרטים
              </Button>
            </EventDetailsDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsList;
