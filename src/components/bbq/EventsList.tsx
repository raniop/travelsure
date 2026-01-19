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
            <h2 className="text-2xl md:text-3xl font-bold">אירועים קרובים</h2>
            <Badge variant="default" className="text-sm px-3 py-1">{futureEvents.length}</Badge>
          </div>
          <div className="space-y-4">
            {futureEvents.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                groupId={groupId}
                userId={userId}
                isAdmin={isAdmin}
                onPaymentsCalculated={onPaymentsCalculated}
                index={index}
                isFuture={true}
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
            <h2 className="text-2xl md:text-3xl font-bold">אירועים שעברו</h2>
            <Badge variant="secondary" className="text-sm px-3 py-1">{pastEvents.length}</Badge>
          </div>
          <div className="space-y-4">
            {pastEvents.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                groupId={groupId}
                userId={userId}
                isAdmin={isAdmin}
                onPaymentsCalculated={onPaymentsCalculated}
                index={index}
                isFuture={false}
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
}

const EventCard = ({ event, groupId, userId, isAdmin, onPaymentsCalculated, index, isFuture }: EventCardProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [userMember, setUserMember] = useState<any>(null);
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
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
          const confirmed = attendees.filter((a: any) => a.attended === true).length;
          setConfirmedCount(confirmed);
        } catch (error) {
          console.error("Error loading confirmed attendees:", error);
          setConfirmedCount(0);
        }
      } catch (error) {
        console.error("Error loading members:", error);
      }
    };
    loadMembers();
  }, [groupId, event.id, isFuture]);

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
          created_at: existingAttendee.created_at
        };
        await apiClient.updateAttendee(existingAttendee.id, updateData);
      } else if (attended) {
        await apiClient.createAttendee({
          event_id: event.id,
          member_id: userMember.id,
          attended: true
        });
      }
      
      try {
        const attendees = await apiClient.getAttendees(event.id);
        const confirmed = attendees.filter((a: any) => a.attended === true).length;
        setConfirmedCount(confirmed);
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
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{format(eventDate, "HH:mm", { locale: he })}</span>
                </div>
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
          {/* Stats (משמאל) */}
          <div className="flex flex-wrap justify-start gap-2 w-full sm:w-auto" dir="rtl" style={{ direction: "rtl" }}>
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
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${isFuture ? "bg-green-50 dark:bg-green-950/20" : "bg-gray-50 dark:bg-gray-800/50"}`}>
              <Users className={`w-3.5 h-3.5 ${isFuture ? "text-green-600" : "text-gray-600"}`} />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground leading-tight">מאשרים</span>
                <span className={`text-xs font-bold ${isFuture ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-400"}`}>
                  {confirmedCount}
                </span>
              </div>
            </div>

            {/* Cost */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${isFuture ? "bg-blue-50 dark:bg-blue-950/20" : "bg-gray-50 dark:bg-gray-800/50"}`}>
              <Coins className={`w-3.5 h-3.5 ${isFuture ? "text-blue-600" : "text-gray-600"}`} />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground leading-tight">עלות</span>
                <span className={`text-xs font-bold ${isFuture ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-400"}`}>
                  {totalCost.toFixed(2)} ₪
                </span>
              </div>
            </div>

            {/* Location */}
            {hostMember && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${isFuture ? "bg-purple-50 dark:bg-purple-950/20" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                <MapPin className={`w-3.5 h-3.5 ${isFuture ? "text-purple-600" : "text-gray-600"}`} />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground leading-tight">מיקום</span>
                  <span className={`text-xs font-bold truncate max-w-[100px] ${isFuture ? "text-purple-700 dark:text-purple-400" : "text-gray-700 dark:text-gray-400"}`}>
                    {hostMember.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Button (מימין) */}
          <div className="self-end sm:self-auto">
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
