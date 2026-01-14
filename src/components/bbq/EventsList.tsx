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
  showHistory?: boolean;
  onPaymentsCalculated?: () => void;
}

const EventsList = ({ groupId, showHistory = false, onPaymentsCalculated }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [groupId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const events = await apiClient.getEvents(groupId);
      setEvents(events);
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
  const now = new Date();
  const futureEvents = events
    .filter(event => new Date(event.event_date) >= now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()); // Ascending - closest first
  
  const pastEvents = events
    .filter(event => new Date(event.event_date) < now)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()); // Descending - most recent first

  // Limit past events if not showing full history
  const displayPastEvents = showHistory ? pastEvents : pastEvents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Future Events */}
      {futureEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">אירועים קרובים</h2>
            <Badge variant="default" className="mr-auto">{futureEvents.length}</Badge>
          </div>
          <div className="space-y-4">
            {futureEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                groupId={groupId} 
                onPaymentsCalculated={onPaymentsCalculated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {displayPastEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">אירועים שעברו</h2>
            <Badge variant="secondary" className="mr-auto">
              {displayPastEvents.length}{!showHistory && pastEvents.length > 5 && ` מתוך ${pastEvents.length}`}
            </Badge>
          </div>
          <div className="space-y-4">
            {displayPastEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                groupId={groupId} 
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
  onPaymentsCalculated?: () => void;
}

const EventCard = ({ event, groupId, onPaymentsCalculated }: EventCardProps) => {
  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}
            </CardTitle>
            {event.description && (
              <CardDescription className="mt-2">{event.description}</CardDescription>
            )}
          </div>
          <Badge variant={isPast ? "secondary" : "default"}>
            {isPast ? "עבר" : "קרוב"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{event.total_cost.toFixed(2)} ₪</span>
            </div>
          </div>
          <EventDetailsDialog eventId={event.id} groupId={groupId} onPaymentsCalculated={onPaymentsCalculated}>
            <Button 
              variant="default" 
              size="sm" 
              className="min-w-[100px]"
              type="button"
            >
              <ChevronLeft className="w-4 h-4 ml-1" />
              פרטים
            </Button>
          </EventDetailsDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsList;
