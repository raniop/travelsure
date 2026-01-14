import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, ChevronLeft, Clock, History } from "lucide-react";
import { Link } from "react-router-dom";
import EventDetailsDialog from "./EventDetailsDialog";

interface Event {
  id: string;
  event_date: string;
  total_cost: number;
  description: string | null;
  created_at: string;
}

interface EventsListProps {
  groupId: string;
  userId: string;
  isAdmin: boolean;
  showHistory?: boolean;
  onPaymentsCalculated?: () => void;
}

const EventsList = ({ groupId, userId, isAdmin, showHistory = false, onPaymentsCalculated }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, isAdmin, userId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await apiClient.getEvents(groupId);
      
      console.log('EventsList - loadEvents called');
      console.log('EventsList - isAdmin:', isAdmin, 'typeof isAdmin:', typeof isAdmin);
      console.log('EventsList - userId:', userId);
      console.log('EventsList - allEvents count:', allEvents.length);
      console.log('EventsList - allEvents:', allEvents.map(e => ({ id: e.id, date: e.event_date })));
      
      // Admin sees all events, non-admin only sees events they attended (for past events)
      // Check isAdmin more safely - handle both boolean true and string "true"
      const isAdminUser = isAdmin === true || isAdmin === "true" || String(isAdmin).toLowerCase() === "true";
      
      if (isAdminUser) {
        // Admin sees all events - no filtering, show everything
        console.log('EventsList - Admin user detected, showing all events:', allEvents.length);
        setEvents(allEvents);
        setLoading(false);
        return;
      }
      
      console.log('EventsList - Non-admin user, filtering events...');
      
      // Get user's phone from localStorage
      const savedUser = localStorage.getItem('bbq_current_user');
      const userPhone = savedUser ? JSON.parse(savedUser).phone : null;
      
      // Get all members to find user's member_id
      const members = await apiClient.getMembers(groupId);
      const userMember = members.find((m: any) => m.phone === userPhone);
      
      if (!userMember) {
        // If user is not a member, show all future events only
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
          
          // Future events - always show
          if (eventDate >= today) {
            return event;
          }
          
          // Past events - only show if user was present
          try {
            const attendees = await apiClient.getAttendees(event.id);
            const userAttended = attendees.some((a: any) => a.member_id === userMemberId && a.attended);
            console.log(`Event ${event.id} (${event.event_date}): userAttended=${userAttended}, userMemberId=${userMemberId}`, attendees);
            return userAttended ? event : null;
          } catch (error) {
            console.error(`Error checking attendees for event ${event.id}:`, error);
            return null;
          }
        })
      );
      
      const finalEvents = filteredEvents.filter(e => e !== null) as Event[];
      console.log('EventsList - Filtered events count:', finalEvents.length);
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
    return <div className="text-center py-8">טוען אירועים...</div>;
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          עדיין אין אירועים. צור אירוע ראשון!
        </CardContent>
      </Card>
    );
  }

  // Separate events into future and past
  // Use start of today (00:00:00) to compare - events today are considered future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureEvents = events
    .filter(event => {
      const eventDate = new Date(event.event_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()); // Ascending - closest first
  
  const pastEvents = events
    .filter(event => {
      const eventDate = new Date(event.event_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    })
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()); // Descending - most recent first

  // Show all past events (no limit)
  const displayPastEvents = pastEvents;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Future Events */}
      {futureEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-xl font-semibold">אירועים קרובים</h2>
            <Badge variant="default">{futureEvents.length}</Badge>
          </div>
          <div className="space-y-4">
            {futureEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                groupId={groupId}
                userId={userId}
                isAdmin={isAdmin}
                onPaymentsCalculated={onPaymentsCalculated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {displayPastEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-muted-foreground shrink-0" />
            <h2 className="text-xl font-semibold">אירועים שעברו</h2>
            <Badge variant="secondary">
              {displayPastEvents.length}{!showHistory && pastEvents.length > 5 && ` מתוך ${pastEvents.length}`}
            </Badge>
          </div>
          <div className="space-y-4">
            {displayPastEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                groupId={groupId}
                userId={userId}
                isAdmin={isAdmin}
                onPaymentsCalculated={onPaymentsCalculated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show message if no events in either category */}
      {futureEvents.length === 0 && displayPastEvents.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            עדיין אין אירועים. צור אירוע ראשון!
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
}

const EventCard = ({ event, groupId, userId, isAdmin, onPaymentsCalculated }: EventCardProps) => {
  const eventDate = new Date(event.event_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDateOnly = new Date(eventDate);
  eventDateOnly.setHours(0, 0, 0, 0);
  const isPast = eventDateOnly < today;

  return (
    <Card className="hover:shadow-lg transition-shadow" dir="rtl">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <span className="truncate">{format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}</span>
            </CardTitle>
            {event.description && (
              <CardDescription className="mt-2">{event.description}</CardDescription>
            )}
          </div>
          <Badge variant={isPast ? "secondary" : "default"} className="shrink-0">
            {isPast ? "עבר" : "קרוב"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">{event.total_cost.toFixed(2)} ₪</span>
          </div>
          <EventDetailsDialog eventId={event.id} groupId={groupId} userId={userId} isAdmin={isAdmin} onPaymentsCalculated={onPaymentsCalculated}>
            <Button 
              variant="default" 
              size="sm" 
              className="min-w-[100px] shrink-0"
              type="button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              פרטים
            </Button>
          </EventDetailsDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsList;
