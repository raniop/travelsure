import { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, BarChart3, LineChart, ChevronRight, ChevronLeft, Users, Activity, Award, Trophy, ArrowUpRight, ArrowDownRight, Coins, UserPlus, FileDown, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { exportReportsPdf } from "@/lib/bbq/exportReportsPdf";

const BBQ_REPORT_PDF_SLOT_ID = "bbq-report-pdf-slot";

interface ReportsProps {
  groupId: string;
  /** שם הקבוצה מספיק לכותרת ב־PDF; אם חסר — נטען מ־API */
  groupName?: string;
  /** כשטאב הדוחות פעיל: בדסקטופ הכפתור מוצג בפס מתחת לטאבים (מיושר לשמאל, מתחת ל«הגדרות») */
  pdfToolbarSlotActive?: boolean;
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
  totalDeposited?: number; // סה"כ שהפקיד (יתרה + כל הניכויים)
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

const Reports = ({
  groupId,
  groupName: groupNameProp,
  pdfToolbarSlotActive = false,
}: ReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [groupNameResolved, setGroupNameResolved] = useState("");
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

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const [toolbarSlotEl, setToolbarSlotEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!pdfToolbarSlotActive || !isDesktop) {
      setToolbarSlotEl(null);
      return;
    }
    setToolbarSlotEl(document.getElementById(BBQ_REPORT_PDF_SLOT_ID));
  }, [pdfToolbarSlotActive, isDesktop]);

  useEffect(() => {
    loadReports();
    loadChartData();
  }, [groupId, reportScope, currentMonth, monthFrom, monthTo]);

  useEffect(() => {
    if (groupNameProp?.trim()) {
      setGroupNameResolved(groupNameProp.trim());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const g = await apiClient.getGroup(groupId);
        if (!cancelled && g?.name) setGroupNameResolved(String(g.name).trim());
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, groupNameProp]);

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

          const totalDeposited = parseFloat((currentBalance + deductedTotal).toFixed(2));
          return {
            memberId: member.id,
            memberName: member.name,
            memberNickname: member.nickname ?? null,
            profileImage: profileImage ?? null,
            eventsAttended: 0,
            totalPaid,
            totalPending: 0,
            totalOwed: currentBalance < 0 ? Math.abs(currentBalance) : 0,
            currentBalance,
            totalDeposited,
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

  const reportScopeLabel =
    reportScope === "all"
      ? "הכל מתחילת הפעילות"
      : reportScope === "current_month"
        ? "חודש בודד (נבחר למעלה)"
        : "טווח חודשים (נבחר למעלה)";

  const handleExportPdf = async () => {
    try {
      setPdfExporting(true);
      exportReportsPdf({
        groupName: groupNameResolved || groupNameProp?.trim() || "קבוצת BBQ",
        generatedAt: format(new Date(), "d בMMMM yyyy 'בשעה' HH:mm", { locale: he }),
        rangeLabel,
        reportScopeLabel,
        summary: {
          events: totalEventsInMonth,
          totalDeducted,
          totalBalance,
          guestPayments: totalGuestPayments,
        },
        members: reports.map((r) => ({
          name: r.memberName,
          nickname: r.memberNickname ?? null,
          eventsAttended: r.eventsAttended,
          totalPaid: r.totalPaid,
          currentBalance: r.currentBalance ?? 0,
          totalDeposited: r.totalDeposited ?? 0,
          owes: r.totalOwed,
        })),
        eventsInPeriod: monthEvents.map((e: any) => {
          const butcher = Number(e.butcher_cost) || 0;
          const grocery = Number(e.grocery_cost) || 0;
          const summed = butcher + grocery;
          const cost =
            summed > 0 ? summed : Number(e.total_cost) || 0;
          return {
          dateLabel: format(new Date(e.event_date), "EEEE, d בMMMM yyyy", { locale: he }),
          description: (e.description as string) || "",
            cost,
          };
        }),
        monthlyOverview: [...monthlyData].reverse().map((m) => ({
          month: m.month,
          events: m.events,
          deducted: m.paid,
        })),
        attendance: memberAttendanceData.map((a) => ({ name: a.name, events: a.events })),
        hosts: hostStats.map((h) => ({
          name: h.memberName,
          nickname: h.memberNickname ?? null,
          count: h.eventCount,
        })),
      });
      toast({
        title: "חלון הדפסה",
        description:
          "אמור להיפתח מיד מתפריט המדפיס — בחרו «Microsoft Print to PDF» או «שמירה כ‑PDF». אם כלום לא קורה, רעננו (Ctrl+F5) כדי לטעון גרסה עדכנית.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור את קובץ ה־PDF",
        variant: "destructive",
      });
    } finally {
      setPdfExporting(false);
    }
  };

  const showPdfInToolbar = toolbarSlotEl != null;

  const pdfExportButton = (
    <Button
      type="button"
      variant="default"
      size="sm"
      className="gap-2 shrink-0 bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
      onClick={() => void handleExportPdf()}
      disabled={pdfExporting || loading}
    >
      {pdfExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      ייצוא PDF לקבוצה
    </Button>
  );

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
      {showPdfInToolbar && toolbarSlotEl
        ? createPortal(pdfExportButton, toolbarSlotEl)
        : null}

      {/* Header + בחירת תקופה — דסקטופ: כפתור PDF בשורת הטאבים (מתחת ל«הגדרות»); מובייל: בשורה תחת הכותרת */}
      <div className="flex flex-col gap-3 pb-4" dir="rtl" style={{ direction: "rtl" }}>
        <div className="min-w-0 w-full">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-right mb-1">
            דוחות וסטטיסטיקות
          </h2>
          <p className="text-xs text-muted-foreground text-right hidden sm:block">
            ייצוא PDF דרך ההדפדפן (שמירה כ‑PDF) — כולל סיכומים, חברים, אירועים, מגמות, נוכחות ומארחים
          </p>
        </div>
        {!showPdfInToolbar ? (
          <div className="flex w-full justify-end">
            {pdfExportButton}
          </div>
        ) : null}
      </div>

      <div className="pb-4 pt-2" dir="rtl" style={{ direction: "rtl" }}>
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

        {/* נוכחות חברים – פודיום לפי מקומות; אותו מספר אירועים = אותו מקום (מקובצים) */}
        {memberAttendanceData.length > 0 && (() => {
          const maxEvents = Math.max(...memberAttendanceData.map((e) => e.events), 1);
          const byEvents = new Map<number, MemberAttendanceData[]>();
          memberAttendanceData.forEach((e) => {
            const list = byEvents.get(e.events) || [];
            list.push(e);
            byEvents.set(e.events, list);
          });
          const sortedCounts = [...byEvents.keys()].sort((a, b) => b - a);
          const places: { place: number; events: number; members: MemberAttendanceData[] }[] = [];
          sortedCounts.forEach((events, idx) => {
            places.push({ place: idx + 1, events, members: byEvents.get(events)! });
          });
          const top3Places = places.slice(0, 3);
          const restPlaces = places.slice(3);
          const podiumOrder = [1, 0, 2];
          const stepConfig = {
            1: { frontH: 72, topMinH: 132, flex: "1.25", maxW: "200px", topBg: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 15%, #fde68a 40%, #fcd34d 70%, #f59e0b 100%)", frontBg: "linear-gradient(180deg, #f59e0b 0%, #d97706 30%, #b45309 70%, #92400e 100%)", glow: "0 0 30px rgba(245,158,11,0.4), 0 12px 28px rgba(0,0,0,0.15)" },
            2: { frontH: 48, topMinH: 108, flex: "1", maxW: "160px", topBg: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 20%, #e2e8f0 60%, #cbd5e1 100%)", frontBg: "linear-gradient(180deg, #94a3b8 0%, #64748b 40%, #475569 100%)", glow: "0 8px 24px rgba(0,0,0,0.12)" },
            3: { frontH: 32, topMinH: 96, flex: "1", maxW: "160px", topBg: "linear-gradient(180deg, #fef3c7 0%, #fde68a 25%, #f59e0b 60%, #d97706 100%)", frontBg: "linear-gradient(180deg, #b45309 0%, #92400e 50%, #78350f 100%)", glow: "0 8px 24px rgba(0,0,0,0.12)" },
          };
          return (
            <Card className="rounded-3xl overflow-hidden border-0 shadow-2xl bg-card" dir="rtl">
              <header className="bg-gradient-to-l from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white" dir="rtl">
                <div className="flex items-center gap-4 justify-start max-w-full w-full">
                  <div className="text-right min-w-0">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight">נוכחות חברים</h3>
                    <p className="text-white/90 text-sm mt-0.5">{rangeLabel}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/20 backdrop-blur shrink-0">
                    <Trophy className="w-7 h-7" />
                  </div>
                </div>
              </header>
              <CardContent className="p-4 md:p-6">
                {/* פודיום אמיתי מאפס: משטח עליון + חזית עם מספר ענק, בסיס מאוחד */}
                <div className="relative flex flex-col items-center mb-8">
                  <div className="flex items-end justify-center gap-0 w-full max-w-2xl mx-auto" style={{ minHeight: 220 }}>
                    {podiumOrder.map((idx) => {
                      if (idx >= top3Places.length) return null;
                      const slot = top3Places[idx];
                      const cfg = stepConfig[slot.place as 1 | 2 | 3];
                      if (!cfg) return null;
                      const isFirst = slot.place === 1;
                      return (
                        <div
                          key={slot.place}
                          className="flex flex-col items-center flex-shrink-0"
                          style={{ flex: cfg.flex, maxWidth: cfg.maxW }}
                        >
                          <div
                            className="w-full rounded-t-xl overflow-hidden flex flex-col items-center justify-end text-center px-3 pt-3 pb-2 border border-white/30 border-b-0 shadow-lg"
                            style={{
                              minHeight: cfg.topMinH,
                              background: cfg.topBg,
                              boxShadow: cfg.glow,
                            }}
                          >
                            <span className="text-2xl font-black text-gray-900 tabular-nums">{slot.events}</span>
                            <span className="text-xs text-gray-700 font-medium mt-0.5">אירועים</span>
                            <div className="mt-2 w-full text-sm font-bold text-gray-800 space-y-0.5" title={slot.members.map((m) => m.name).join(", ")}>
                              {slot.members.map((m, j) => (
                                <span key={j} className="block truncate">{m.name}</span>
                              ))}
                            </div>
                          </div>
                          <div
                            className="w-full flex items-center justify-center rounded-b-md border border-white/20 border-t-0 font-black text-white"
                            style={{
                              height: cfg.frontH,
                              background: cfg.frontBg,
                              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.2)",
                              textShadow: "0 2px 4px rgba(0,0,0,0.4)",
                              fontSize: isFirst ? "3rem" : slot.place === 2 ? "2.25rem" : "1.75rem",
                            }}
                          >
                            {slot.place}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className="w-full max-w-2xl h-4 rounded-b-xl mx-auto -mt-px"
                    style={{
                      background: "linear-gradient(180deg, #57534e 0%, #44403c 50%, #292524 100%)",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                    }}
                  />
                </div>
                {/* מי שלא בפודיום – רשימה נפרדת */}
                {restPlaces.length > 0 && (
                  <div className="border-t border-border pt-5 mt-2" dir="rtl">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 text-right">שאר המשתתפים</h4>
                    <div className="space-y-2">
                      {restPlaces.map((slot, idx) => {
                        const placeNum = 4 + idx;
                        const names = slot.members.map((m) => m.name).join(" • ");
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 w-full py-2 px-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                          >
                            <span className="w-7 text-right text-muted-foreground tabular-nums text-sm font-medium shrink-0">{placeNum}</span>
                            <span className="font-medium text-right flex-1 min-w-0 truncate" title={names}>{names}</span>
                            <span className="text-sm text-muted-foreground tabular-nums shrink-0" style={{ direction: "ltr" }}>{slot.events} אירועים</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

                      {/* סה"כ שהפקיד */}
                      {report.totalDeposited !== undefined && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" dir="rtl">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">סה&quot;כ שהפקיד</span>
                            <span className="text-sm md:text-base font-semibold">
                              <span dir="ltr" className="tabular-nums">{report.totalDeposited.toFixed(2)}</span> שקל
                            </span>
                          </div>
                          <TrendingUp className="w-4 h-4 shrink-0" />
                        </div>
                      )}

                      {/* Events */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-foreground" dir="rtl">
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
