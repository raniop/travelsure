import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateEventDialogProps {
  groupId: string;
  onEventCreated: () => void;
  children: React.ReactNode;
}

const CreateEventDialog = ({ groupId, onEventCreated, children }: CreateEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [butcherCost, setButcherCost] = useState("");
  const [groceryCost, setGroceryCost] = useState("");
  const [description, setDescription] = useState("");
  const [hostMemberId, setHostMemberId] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, groupId]);

  const loadMembers = async () => {
    try {
      const membersData = await apiClient.getMembers(groupId);
      setMembers(membersData.filter(m => m.is_active !== false));
    } catch (error: any) {
      console.error("Error loading members:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const butcher = parseFloat(butcherCost) || 0;
    const grocery = parseFloat(groceryCost) || 0;
    const total = butcher + grocery;
    
    if (!eventDate) {
      toast({
        title: "שגיאה",
        description: "אנא בחר תאריך לאירוע",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Create event
      // Format date as YYYY-MM-DD in local timezone (not UTC)
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const event = await apiClient.createEvent({
        group_id: groupId,
        event_date: formattedDate,
        butcher_cost: butcher,
        grocery_cost: grocery,
        total_cost: total,
        description: description || null,
        host_member_id: hostMemberId || null
      });

      toast({
        title: "הצלחה!",
        description: "האירוע נוצר בהצלחה"
      });

      setOpen(false);
      setEventDate(new Date());
      setButcherCost("");
      setGroceryCost("");
      setDescription("");
      setHostMemberId("");
      onEventCreated();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו ליצור את האירוע",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>יצירת אירוע חדש</DialogTitle>
            <DialogDescription>
              צור אירוע חדש. ניתן להוסיף עלויות מאוחר יותר בעריכה
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">תאריך האירוע</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    {eventDate ? format(eventDate, "PPP", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => date && setEventDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="butcher">קצבייה (₪) - אופציונלי</Label>
              <Input
                id="butcher"
                type="number"
                step="0.01"
                min="0"
                value={butcherCost}
                onChange={(e) => setButcherCost(e.target.value)}
                placeholder="0.00"
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grocery">סופר (₪) - אופציונלי</Label>
              <Input
                id="grocery"
                type="number"
                step="0.01"
                min="0"
                value={groceryCost}
                onChange={(e) => setGroceryCost(e.target.value)}
                placeholder="0.00"
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="host">מיקום האירוע (בית המארח)</Label>
              <Select value={hostMemberId} onValueChange={setHostMemberId}>
                <SelectTrigger id="host" className="text-right" dir="rtl">
                  <SelectValue placeholder="בחר מארח" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="text-right">
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">תיאור (אופציונלי)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="מה היה באירוע..."
                rows={3}
                className="text-right"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "יוצר..." : "צור אירוע"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
