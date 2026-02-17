import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, BarChart3, PieChart, LineChart, ChevronRight, ChevronLeft, Users, Activity, Award, ArrowUpRight, ArrowDownRight, Coins, UserPlus } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ReportsProps {
  groupId: string;
}

interface MemberReport {
  memberId: string;
  memberName: string;
  memberNickname?: string | null;
  profileImage?: string | null;
  eventsAttended: number;
  totalPaid: number;
  totalPending: number;
  totalOwed: number;
  currentBalance?: number;
}

interface MonthlyData {
  month: string;
  events: number;
  paid: number;
  pending: number;
}

interface MemberAttendanceData {
  name: string;
  events: number;
}

interface HostStats {
  memberId: string;
  memberName: string;
  memberNickname?: string | null;
  eventCount: number;
}

type ReportScope = "all" | "current_month" | "range";

const Reports = ({ groupId }: ReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<MemberReport[]>([]);
  const [reportScope, setReportScope] = useState<ReportScope>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthFrom, setMonthFrom] = useState(() => {
    const d = new Date();
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [monthTo, setMonthTo] = useState(new Date());
  const [totalEventsInMonth, setTotalEventsInMonth] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [memberAttendanceData, setMemberAttendanceData] = useState<MemberAttendanceData[]>([]);
  const [monthEvents, setMonthEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [hostStats, setHostStats] = useState<HostStats[]>([]);
  const [totalGuestPayments, setTotalGuestPayments] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
    loadChartData();
  }, [groupId, reportScope, currentMonth, monthFrom, monthTo]);

  const loadChartData = async () => {
    try {
      // Load monthly data for last 6 months
      const allEvents = await apiClient.getEvents(groupId);
      const monthlyStats: MonthlyData[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthEvents = allEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
        
        let monthDeducted = 0;
        
        for (const event of monthEvents) {
          try {
            const payments = await apiClient.getPayments(event.id);
            for (const payment of payments) {
              if (payment.payer_type === "member" && payment.payment_status !== "paid") {
                monthDeducted += parseFloat((payment.amount || 0).toFixed(2));
              }
            }
          } catch (error) {
            console.error(`Error loading payments for event ${event.id}:`, error);
          }
        }
        
        monthlyStats.push({
          month: format(monthDate, "MMM yyyy", { locale: he }),
          events: monthEvents.length,
          paid: monthDeducted, // Use deducted as "paid" for display
          pending: 0 // No pending in balance model
        });
      }
      
      setMonthlyData(monthlyStats);
      
      // נוכחות: לפי ה-scope (הכל / חודש נוכחי / טווח)
      let monthEventsForAttendance: any[];
      if (reportScope === "all") {
        monthEventsForAttendance = [...allEvents];
      } else if (reportScope === "current_month") {
        const monthStartForAttendance = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        monthStartForAttendance.setHours(0, 0, 0, 0);
        const monthEndForAttendance = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        monthEndForAttendance.setHours(23, 59, 59, 999);
        monthEventsForAttendance = allEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= monthStartForAttendance && eventDate <= monthEndForAttendance;
        });
      } else {
        const rangeStart = new Date(monthFrom.getFullYear(), monthFrom.getMonth(), 1);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(monthTo.getFullYear(), monthTo.getMonth() + 1, 0);
        rangeEnd.setHours(23, 59, 59, 999);
        monthEventsForAttendance = allEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= rangeStart && eventDate <= rangeEnd;
        });
      }
      
      // Load all members and attendees in parallel to optimize performance
      const allMembers = await apiClient.getMembers(groupId);
      const attendeesPromises = monthEventsForAttendance.map(event => 
        apiClient.getAttendees(event.id).catch(() => [])
      );
      const allAttendeesArrays = await Promise.all(attendeesPromises);
      
      // Create a map of event_id -> attendees for quick lookup
      const attendeesMap = new Map();
      monthEventsForAttendance.forEach((event, index) => {
        attendeesMap.set(event.id, allAttendeesArrays[index] || []);
      });
      
      const attendanceData: MemberAttendanceData[] = [];
      
      for (const member of allMembers) {
        let eventsAttended = 0;
        for (const event of monthEventsForAttendance) {
          const attendees = attendeesMap.get(event.id) || [];
          const memberAttended = attendees.some(
            (a: any) => a.member_id === member.id && a.attended
          );
          if (memberAttended) {
            eventsAttended++;
          }
        }
        
        if (eventsAttended > 0) {
          attendanceData.push({
            name: member.name,
            events: eventsAttended
          });
        }
      }
      
      attendanceData.sort((a, b) => b.events - a.events);
      setMemberAttendanceData(attendanceData);
      
      // Calculate host statistics (which member hosted the most events)
      const hostCounts: Record<string, number> = {};
      
      for (const event of allEvents) {
        if (event.host_member_id) {
          hostCounts[event.host_member_id] = (hostCounts[event.host_member_id] || 0) + 1;
        }
      }
      
      const hostStatsArray: HostStats[] = allMembers
        .filter(m => hostCounts[m.id])
        .map(m => ({
          memberId: m.id,
          memberName: m.name,
          memberNickname: m.nickname || null,
          eventCount: hostCounts[m.id]
        }))
        .sort((a, b) => b.eventCount - a.eventCount);
      
      setHostStats(hostStatsArray);
    } catch (error) {
      console.error("Error loading chart data:", error);
    }
  };

  const DEPOSIT_PER_MEMBER = 500;

  const loadReports = async () => {
    try {
      setLoading(true);

      const allEvents = await apiClient.getEvents(groupId);
      let scopeEvents: any[];
      if (reportScope === "all") {
        scopeEvents = [...allEvents];
      } else if (reportScope === "current_month") {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        scopeEvents = allEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
      } else {
        const rangeStart = new Date(monthFrom.getFullYear(), monthFrom.getMonth(), 1);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(monthTo.getFullYear(), monthTo.getMonth() + 1, 0);
        rangeEnd.setHours(23, 59, 59, 999);
        scopeEvents = allEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= rangeStart && eventDate <= rangeEnd;
        });
      }

      setTotalEventsInMonth(scopeEvents.length);
      setMonthEvents([...scopeEvents].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));

      const membersData = await apiClient.getMembers(groupId);
      setMembers(membersData);

      // Load ALL payments for ALL events (for balance calculation and month stats)
      const allPaymentsByEvent: { eventId: string; payments: any[] }[] = [];
      for (const event of allEvents) {
        try {
          const payments = await apiClient.getPayments(event.id);
          allPaymentsByEvent.push({ eventId: event.id, payments });
        } catch (e) {
          console.error(`Error loading payments for event ${event.id}:`, e);
        }
      }
      const allPaymentsFlat = allPaymentsByEvent.flatMap(({ payments }) => payments);

      let usersWithImages: any[] = [];
      try {
        usersWithImages = await apiClient.getUsers();
      } catch (userError) {
        console.error("Error loading users for profile images:", userError);
      }

      const monthEventIds = new Set(scopeEvents.map((e: any) => e.id));

      const memberReports: MemberReport[] = membersData
        .filter((m: any) => m.is_active !== false)
        .map((member: any) => {
          let profileImage: string | null = null;
          if (member.phone) {
            const user = usersWithImages.find((u: any) => u.phone === member.phone);
            if (user?.profile_image) profileImage = user.profile_image;
          }

          // יתרה: כמו בעמוד חברים – 500 − ניכויים; אם יש הפקדה נוספת (שמורה) משתמשים בה
          const deductedTotal = allPaymentsFlat
            .filter((p: any) => p.payer_type === "member" && p.payer_id === member.id && p.payment_status !== "paid")
            .reduce((sum: number, p: any) => sum + parseFloat((p.amount || 0).toFixed(2)), 0);
          const calculatedBalance = parseFloat((DEPOSIT_PER_MEMBER - deductedTotal).toFixed(2));
          const storedBalance = member.balance != null ? parseFloat((member.balance).toFixed(2)) : null;
          const currentBalance = storedBalance != null && storedBalance > calculatedBalance ? storedBalance : calculatedBalance;

          // חודש נבחר: אירועים שהחבר השתתף + סכום שנקוזז
          let eventsAttended = 0;
          let totalPaid = 0;
          for (const { eventId, payments } of allPaymentsByEvent) {
            if (!monthEventIds.has(eventId)) continue;
            const memberPayment = payments.find((p: any) => p.payer_id === member.id && p.payer_type === "member");
            if (memberPayment && memberPayment.payment_status !== "paid") {
              totalPaid += parseFloat((memberPayment.amount || 0).toFixed(2));
            }
          }

          return {
            memberId: member.id,
            memberName: member.name,
            memberNickname: member.nickname ?? null,
            profileImage: profileImage ?? null,
            eventsAttended: 0, // מחשבים בהמשך עם attendees
            totalPaid,
            totalPending: 0,
            totalOwed: currentBalance < 0 ? Math.abs(currentBalance) : 0,
            currentBalance,
          };
        });

      // טעינת נוכחות (attendees) לפי התקופה הנבחרת
      const attendeesByEventId = new Map<string, any[]>();
      for (const event of scopeEvents) {
        try {
          const attendees = await apiClient.getAttendees(event.id);
          attendeesByEventId.set(event.id, attendees);
        } catch (e) {
          console.error(`Error loading attendees for event ${event.id}:`, e);
        }
      }
      for (const report of memberReports) {
        const member = membersData.find((m: any) => m.id === report.memberId);
        if (!member) continue;
        let count = 0;
        for (const event of scopeEvents) {
          const attendees = attendeesByEventId.get(event.id) || [];
          if (attendees.some((a: any) => a.member_id === member.id && a.attended)) count++;
        }
        report.eventsAttended = count;
      }

      memberReports.sort((a, b) => {
        if (a.eventsAttended !== b.eventsAttended) return b.eventsAttended - a.eventsAttended;
        return a.memberName.localeCompare(b.memberName, "he");
      });
      setReports(memberReports);

      // תשלומי אורחים – רק אירועים של החודש הנבחר
      let guestPaymentsTotal = 0;
      for (const { eventId, payments } of allPaymentsByEvent) {
        if (!monthEventIds.has(eventId)) continue;
        for (const p of payments) {
          if (p.payer_type === "guest") guestPaymentsTotal += parseFloat((p.amount || 0).toFixed(2));
        }
      }
      setTotalGuestPayments(guestPaymentsTotal);
    } catch (error: any) {
      console.error("Error loading reports:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הדוחות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMonthYear = (date: Date) => {
    return format(date, "MMMM yyyy", { locale: he });
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען דוחות...</p>
        </div>
      </div>
    );
  }

  const monthYear = formatMonthYear(currentMonth);
  const totalDeducted = reports.reduce((sum, r) => sum + r.totalPaid, 0);
  let totalBalance = 0;
  for (const r of reports) {
    if (r.currentBalance !== undefined && r.currentBalance !== null) {
      const balance = typeof r.currentBalance === 'string' ? parseFloat(r.currentBalance) : r.currentBalance;
      totalBalance += balance;
    }
  }
  const rangeLabel =
    reportScope === "all"
      ? "מתחילת הפעילות"
      : reportScope === "current_month"
        ? monthYear
        : `${formatMonthYear(monthFrom)} – ${formatMonthYear(monthTo)}`;

  const CHART_COLORS = [
    "hsl(170, 58%, 42%)",
    "hsl(200, 70%, 48%)",
    "hsl(280, 55%, 52%)",
    "hsl(32, 78%, 52%)",
    "hsl(145, 55%, 42%)",
    "hsl(15, 82%, 55%)",
    "hsl(260, 60%, 58%)",
    "hsl(50, 75%, 50%)",
    "hsl(330, 65%, 55%)",
    "hsl(190, 65%, 45%)",
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6 w-full" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      {/* Header + בחירת תקופה */}
      <div className="pb-4" dir="rtl" style={{ direction: "rtl" }}>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-right mb-4">
          דוחות וסטטיסטיקות
        </h2>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground text-right">תקופת דוח</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={reportScope === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setReportScope("all")}
            >
              הכל מתחילת הפעילות
            </Button>
            <Button
              variant={reportScope === "current_month" ? "default" : "outline"}
              size="sm"
              onClick={() => setReportScope("current_month")}
            >
              חודש נוכחי
            </Button>
            <Button
              variant={reportScope === "range" ? "default" : "outline"}
              size="sm"
              onClick={() => setReportScope("range")}
            >
              מחודש עד חודש
            </Button>
          </div>

          {reportScope === "current_month" && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30" dir="rtl">
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold">{monthYear}</span>
                <span className="text-xs text-muted-foreground">{totalEventsInMonth} אירועים</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {reportScope === "range" && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/30" dir="rtl">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">מחודש</label>
                <input
                  type="month"
                  value={`${monthFrom.getFullYear()}-${String(monthFrom.getMonth() + 1).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split("-").map(Number);
                    setMonthFrom(new Date(y, m - 1, 1));
                  }}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">עד חודש</label>
                <input
                  type="month"
                  value={`${monthTo.getFullYear()}-${String(monthTo.getMonth() + 1).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split("-").map(Number);
                    setMonthTo(new Date(y, m - 1, 1));
                  }}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          )}

          {reportScope === "all" && (
            <p className="text-sm text-muted-foreground text-right">{rangeLabel} · {totalEventsInMonth} אירועים</p>
          )}
        </div>
      </div>

      {/* Summary Cards - Modern Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Events Card - בחודש נבחר */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground text-right">
                סה"כ אירועים
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground text-right -mt-1">{rangeLabel}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2" dir="rtl" style={{ direction: "rtl" }}>
              <span className="text-3xl md:text-4xl font-bold text-blue-700 dark:text-blue-400">
                {totalEventsInMonth}
              </span>
              <span className="text-sm text-muted-foreground">אירועים</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Deducted */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-red-500/10">
                <Coins className="w-5 h-5 text-red-600" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground text-right">
                סה"כ קוזז מהיתרה
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground text-right -mt-1">{rangeLabel}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2" dir="rtl" style={{ direction: "rtl" }}>
              <span className="text-3xl md:text-4xl font-bold text-red-700 dark:text-red-400">
                {totalDeducted.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">שקל</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Balance - יתרה נוכחית (כל החברים) */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground text-right">
                סה"כ יתרה נוכחית
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground text-right -mt-1">רק חברים</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2" dir="rtl" style={{ direction: "rtl" }}>
              <span className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-400">
                {totalBalance.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">שקל</span>
            </div>
          </CardContent>
        </Card>

        {/* Guest Payments - בחודש נבחר */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <UserPlus className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground text-right">
                תשלומי אורחים
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground text-right -mt-1">{rangeLabel}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2" dir="rtl" style={{ direction: "rtl" }}>
              <span className="text-3xl md:text-4xl font-bold text-orange-700 dark:text-orange-400">
                {totalGuestPayments.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">שקל</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Events Chart */}
        <Card className="border-2 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3 justify-between" dir="rtl" style={{ direction: "rtl", flexDirection: "row-reverse" }}>
              <BarChart3 className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg md:text-xl text-right">אירועים לפי חודש</CardTitle>
            </div>
            <CardDescription className="text-right">6 חודשים אחרונים</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="w-full min-w-0" dir="ltr" style={{ direction: "ltr" }}>
              <ChartContainer
                config={{
                  events: {
                    label: "אירועים",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px] md:h-[300px] w-full"
                dir="ltr"
              >
                <BarChart data={[...monthlyData].reverse()} margin={{ top: 10, right: 20, left: 5, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    angle={-45}
                    height={60}
                  />
                  <YAxis 
                    orientation="right" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
                  />
                  <Bar 
                    dataKey="events" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payments Chart */}
        <Card className="border-2 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
            <div className="flex items-center gap-3 justify-between" dir="rtl" style={{ direction: "rtl", flexDirection: "row-reverse" }}>
              <LineChart className="w-6 h-6 text-red-600" />
              <CardTitle className="text-lg md:text-xl text-right">תשלומים לפי חודש</CardTitle>
            </div>
            <CardDescription className="text-right">6 חודשים אחרונים</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="w-full min-w-0" dir="ltr" style={{ direction: "ltr" }}>
              <ChartContainer
                config={{
                  paid: {
                    label: "קוזז מהיתרה",
                    color: "hsl(0, 84%, 60%)",
                  },
                }}
                className="h-[250px] md:h-[300px] w-full"
                dir="ltr"
              >
                <RechartsLineChart data={[...monthlyData].reverse()} margin={{ top: 10, right: 20, left: 5, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    angle={-45}
                    height={60}
                  />
                  <YAxis 
                    orientation="right" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: "hsl(0, 84%, 60%)", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    stroke="hsl(0, 84%, 60%)" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: "hsl(0, 84%, 60%)" }}
                    activeDot={{ r: 7 }}
                    animationDuration={1000}
                  />
                </RechartsLineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* נוכחות חברים – דירוג ברור: מקום, שם, כמות אירועים + פס יחסי */}
        {memberAttendanceData.length > 0 && (() => {
          const maxEvents = Math.max(...memberAttendanceData.map((e) => e.events), 1);
          return (
            <Card className="border-2 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-right text-lg">נוכחות חברים</CardTitle>
                <CardDescription className="text-right">{rangeLabel}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border" dir="rtl">
                  {memberAttendanceData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-muted-foreground font-bold w-6 text-left tabular-nums" style={{ direction: "ltr" }}>
                        {index + 1}
                      </span>
                      <span className="flex-1 font-medium min-w-0 truncate">{entry.name}</span>
                      <div className="flex items-center gap-3 w-[140px] shrink-0">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-[60px]">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(entry.events / maxEvents) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold tabular-nums w-12 text-left" style={{ direction: "ltr" }}>
                          {entry.events} אירועים
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Host Statistics */}
        {hostStats.length > 0 && (
          <Card className="border-2 shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
              <div className="flex items-center gap-3 justify-between" dir="rtl" style={{ direction: "rtl", flexDirection: "row-reverse" }}>
                <Award className="w-6 h-6 text-amber-600" />
                <CardTitle className="text-lg md:text-xl text-right">אירועים לפי מארח</CardTitle>
              </div>
              <CardDescription className="text-right">מי אירח הכי הרבה אירועים (סה"כ)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {hostStats.map((host, index) => (
                  <div
                    key={host.memberId}
                    className="flex items-center justify-between p-4 rounded-lg border-2 hover:border-primary/50 hover:shadow-md transition-all bg-gradient-to-r from-background to-muted/30"
                    dir="rtl"
                    style={{ direction: "rtl" }}
                  >
                    <div className="flex items-center gap-2 shrink-0" dir="ltr" style={{ direction: "ltr" }}>
                      <span className="text-xs text-muted-foreground">אירועים</span>
                      <Badge variant="secondary" className="text-lg md:text-xl font-bold px-3 py-1">
                        {host.eventCount}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-1" dir="rtl" style={{ direction: "rtl" }}>
                      {index === 0 && (
                        <Award className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div className="flex flex-col items-end">
                        <span className="text-base md:text-lg font-semibold">{host.memberName}</span>
                        {host.memberNickname && (
                          <span className="text-xs md:text-sm text-muted-foreground">{host.memberNickname}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Member Reports - Modern List Design */}
      <Card className="border-2 shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3 justify-between" dir="rtl" style={{ direction: "rtl", flexDirection: "row-reverse" }}>
            <Users className="w-6 h-6 text-primary" />
            <CardTitle className="text-lg md:text-xl text-right">דוחות לפי אנשים</CardTitle>
          </div>
          <CardDescription className="text-right">סטטיסטיקה לכל חבר · {rangeLabel}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">אין דוחות לחודש זה</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report, index) => (
                <div
                  key={report.memberId}
                  className="group relative p-4 rounded-xl border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background via-background to-muted/20"
                  style={{ animationDelay: `${index * 50}ms` }}
                  dir="rtl"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* RIGHT: Member info (pinned to the right edge) */}
                    <div className="flex items-center gap-3 ml-auto text-right">
                      {/* avatar MUST be first in RTL so it sits at the far right */}
                      <Avatar className="w-12 h-12 shrink-0">
                        {report.profileImage ? (
                          <AvatarImage src={report.profileImage} alt={report.memberName} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                            {report.memberName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex flex-col items-end">
                        <div className="font-semibold text-base md:text-lg text-right">{report.memberName}</div>
                        {report.memberNickname && (
                          <div className="text-xs md:text-sm text-muted-foreground text-right">{report.memberNickname}</div>
                        )}
                      </div>
                    </div>

                    {/* LEFT: Stats */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-start" dir="rtl" style={{ direction: "rtl" }}>
                      {/* Balance */}
                      {report.currentBalance !== undefined && (
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            report.currentBalance >= 0
                              ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                          }`}
                          dir="rtl"
                        >
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">יתרה</span>
                            <span className="text-sm md:text-base font-bold">
                              <span dir="ltr" className="tabular-nums">
                                {report.currentBalance < 0 ? "-" : ""}{Math.abs(report.currentBalance).toFixed(2)}
                              </span>{" "}
                              שקל
                            </span>
                          </div>
                          {report.currentBalance >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 shrink-0" />
                          )}
                        </div>
                      )}

                      {/* Paid */}
                      {report.totalPaid > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" dir="rtl">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">שולם</span>
                            <span className="text-sm md:text-base font-semibold">
                              <span dir="ltr" className="tabular-nums">{report.totalPaid.toFixed(2)}</span> שקל
                            </span>
                          </div>
                          <Coins className="w-4 h-4 shrink-0" />
                        </div>
                      )}

                      {/* Events */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" dir="rtl">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">אירועים</span>
                          <span className="text-sm md:text-base font-semibold">{report.eventsAttended}</span>
                        </div>
                        <Calendar className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
