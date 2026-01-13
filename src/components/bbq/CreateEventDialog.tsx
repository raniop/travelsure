import { useState } from "react";
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
  const [totalCost, setTotalCost] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventDate || !totalCost || parseFloat(totalCost) <= 0) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Create event
      const event = await apiClient.createEvent({
        group_id: groupId,
        event_date: eventDate.toISOString().split('T')[0],
        total_cost: parseFloat(totalCost),
        description: description || null
      });

      toast({
        title: "הצלחה!",
        description: "האירוע נוצר בהצלחה"
      });

      setOpen(false);
      setEventDate(new Date());
      setTotalCost("");
      setDescription("");
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
              צור אירוע חדש וציין את העלות הכוללת
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
              <Label htmlFor="cost">עלות כוללת (₪)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">תיאור (אופציונלי)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="מה היה באירוע..."
                rows={3}
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
