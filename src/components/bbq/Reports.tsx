import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, BarChart3, PieChart, LineChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

interface ReportsProps {
  groupId: string;
}

interface MemberReport {
  memberId: string;
  memberName: string;
  memberNickname?: string | null;
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

const Reports = ({ groupId }: ReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<MemberReport[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [totalEventsInMonth, setTotalEventsInMonth] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [memberAttendanceData, setMemberAttendanceData] = useState<MemberAttendanceData[]>([]);
  const [monthEvents, setMonthEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [hostStats, setHostStats] = useState<HostStats[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
    loadChartData();
  }, [groupId, currentMonth]);

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
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
        
        let monthDeducted = 0;
        
        for (const event of monthEvents) {
          try {
            const payments = await apiClient.getPayments(event.id);
            for (const payment of payments) {
              // Only count "deducted" payments (from balance)
              if (payment.payment_status === "deducted") {
                monthDeducted += payment.amount || 0;
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
      
      // Load member attendance data for current month
      const monthStartForAttendance = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      monthStartForAttendance.setHours(0, 0, 0, 0);
      const monthEndForAttendance = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      monthEndForAttendance.setHours(23, 59, 59, 999);
      
      const monthEventsForAttendance = allEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= monthStartForAttendance && eventDate <= monthEndForAttendance;
      });
      
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

  const loadReports = async () => {
    try {
      setLoading(true);

      // Get current month start and end
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      // Load all events in current month
      const allEvents = await apiClient.getEvents(groupId);
      const monthEvents = allEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });

      // Set total events count for the month
      setTotalEventsInMonth(monthEvents.length);
      
      // Store month events for display (sorted by date)
      setMonthEvents(monthEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));

      // Load all members
      const membersData = await apiClient.getMembers(groupId);
      setMembers(membersData);

      // Build reports for each member
      const memberReports: MemberReport[] = await Promise.all(
        membersData.filter(m => m.is_active !== false).map(async (member: any) => {
          // Count events attended in this month
          let eventsAttended = 0;
          let totalPaid = 0;
          let totalPending = 0;

          for (const event of monthEvents) {
            // Check if member attended
            try {
              const attendees = await apiClient.getAttendees(event.id);
              const memberAttended = attendees.some(
                (a: any) => a.member_id === member.id && a.attended
              );

              if (memberAttended) {
                eventsAttended++;

                // Get payments for this member and event
                try {
                  const payments = await apiClient.getPayments(event.id);
                  const memberPayment = payments.find(
                    (p: any) => p.payer_id === member.id && p.payer_type === "member"
                  );

                  if (memberPayment) {
                    // With the new balance model, only "deducted" payments count (from balance)
                    if (memberPayment.payment_status === "deducted") {
                      totalPaid += memberPayment.amount || 0;
                    }
                  }
                } catch (error) {
                  console.error(`Error loading payments for event ${event.id}:`, error);
                }
              }
            } catch (error) {
              console.error(`Error loading attendees for event ${event.id}:`, error);
            }
          }

          // Get current balance from member data
          const currentBalance = member.balance || 0;
          
          // Calculate total deducted this month (from payments with status "deducted")
          let totalDeducted = 0;
          for (const event of monthEvents) {
            try {
              const payments = await apiClient.getPayments(event.id);
              const memberPayment = payments.find(
                (p: any) => p.payer_id === member.id && p.payer_type === "member" && p.payment_status === "deducted"
              );
              if (memberPayment) {
                totalDeducted += memberPayment.amount || 0;
              }
            } catch (error) {
              console.error(`Error loading payments for event ${event.id}:`, error);
            }
          }

          return {
            memberId: member.id,
            memberName: member.name,
            memberNickname: member.nickname || null,
            eventsAttended,
            totalPaid, // This is now total deducted from balance
            totalPending: 0, // No pending in balance model
            totalOwed: currentBalance < 0 ? Math.abs(currentBalance) : 0, // If balance is negative, they owe
            currentBalance // Add current balance
          };
        })
      );

      // Sort by events attended (descending), then by name
      memberReports.sort((a, b) => {
        if (a.eventsAttended !== b.eventsAttended) {
          return b.eventsAttended - a.eventsAttended;
        }
        return a.memberName.localeCompare(b.memberName, 'he');
      });

      setReports(memberReports);
    } catch (error: any) {
      console.error("Error loading reports:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הדוחות",
        variant: "destructive"
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
    return <div className="text-center py-8">טוען דוחות...</div>;
  }

  const monthYear = formatMonthYear(currentMonth);
  // totalDeducted includes only "deducted" payments (from balance)
  const totalDeducted = reports.reduce((sum, r) => sum + r.totalPaid, 0);
  
  // Calculate total balance across all members
  const totalBalance = reports.reduce((sum, r) => sum + (r.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* כותרת בימין */}
        <h2 className="text-xl sm:text-2xl font-semibold text-right">
          דוחות - {monthYear}
        </h2>
        {/* כפתורים בשמאל */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-2 text-sm sm:text-base border rounded hover:bg-muted flex-1 sm:flex-initial min-w-[100px]"
          >
            חודש הבא
          </button>
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-2 text-sm sm:text-base border rounded hover:bg-muted flex-1 sm:flex-initial min-w-[100px]"
          >
            חודש קודם
          </button>
          {currentMonth.getMonth() !== new Date().getMonth() || 
           currentMonth.getFullYear() !== new Date().getFullYear() ? (
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-2 text-sm border rounded hover:bg-muted w-full sm:w-auto"
            >
              חזור לחודש הנוכחי
            </button>
          ) : null}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3 text-right">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">סה"כ אירועים</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-xl sm:text-2xl font-bold flex items-center justify-end gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
              {totalEventsInMonth}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 text-right">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">סה"כ נקזז מהיתרה</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {totalDeducted.toFixed(2)} ₪
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 text-right">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">סה"כ יתרה נוכחית</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-xl sm:text-2xl font-bold flex items-center justify-end gap-2 text-green-600">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              {totalBalance.toFixed(2)} ₪
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Events Chart */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end text-right">
              <BarChart3 className="w-5 h-5" />
              אירועים לפי חודש (6 חודשים אחרונים)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="w-full min-w-0" dir="ltr" style={{ direction: "ltr" }}>
              <ChartContainer
                config={{
                  events: {
                    label: "אירועים",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[250px] sm:h-[300px] w-full"
                dir="ltr"
              >
                <BarChart data={[...monthlyData].reverse()} margin={{ top: 10, right: 20, left: 5, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, textAnchor: 'end' }}
                  angle={-45}
                  height={60}
                />
                <YAxis orientation="right" tick={{ fontSize: 10, textAnchor: 'start' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="events" fill="var(--color-events)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payments Chart */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end text-right">
              <LineChart className="w-5 h-5" />
              תשלומים לפי חודש (6 חודשים אחרונים)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="w-full min-w-0" dir="ltr" style={{ direction: "ltr" }}>
              <ChartContainer
              config={{
                paid: {
                  label: "נקזז מהיתרה",
                  color: "hsl(0, 84%, 60%)",
                },
              }}
                className="h-[250px] sm:h-[300px] w-full"
                dir="ltr"
              >
                <RechartsLineChart data={[...monthlyData].reverse()} margin={{ top: 10, right: 20, left: 5, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, textAnchor: 'end' }}
                  angle={-45}
                  height={60}
                />
                <YAxis orientation="right" tick={{ fontSize: 10, textAnchor: 'start' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="paid" 
                  stroke="hsl(0, 84%, 60%)" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </RechartsLineChart>
            </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Member Attendance Chart */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end text-right">
              <PieChart className="w-5 h-5" />
              נוכחות חברים בחודש {monthYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="text-right">
              {/* הכותרות/טקסט מסביב */}
            </div>
            <div className="flex flex-col lg:flex-row gap-4 items-start w-full min-w-0">
              <div className="flex-1 min-w-0 w-full" dir="ltr" style={{ direction: "ltr" }}>
                <ChartContainer
                  config={memberAttendanceData.reduce((acc, member, index) => {
                    acc[member.name] = {
                      label: member.name,
                      color: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                    };
                    return acc;
                  }, {} as Record<string, { label: string; color: string }>)}
                  className="h-[200px] sm:h-[250px] lg:h-[300px] w-full"
                  dir="ltr"
                >
                  <RechartsPieChart>
                    <Pie
                      data={memberAttendanceData}
                      dataKey="events"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      label={false}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {memberAttendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${(index * 60) % 360}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [`${value} אירועים`, name]}
                    />
                  </RechartsPieChart>
                </ChartContainer>
              </div>
              <div className="flex-shrink-0 w-full sm:min-w-[200px]">
                <div className="flex flex-col gap-2 text-right">
                  {memberAttendanceData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 justify-end">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                      />
                      <span className="text-xs sm:text-sm text-right">
                        {entry.name}: {entry.events}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Statistics */}
        {hostStats.length > 0 && (
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end text-right">
                <BarChart3 className="w-5 h-5" />
                אירועים לפי מארח (סה"כ)
              </CardTitle>
              <CardDescription className="text-right">מי אירח הכי הרבה אירועים</CardDescription>
            </CardHeader>
            <CardContent className="text-right">
              <div className="space-y-3">
                {hostStats.map((host, index) => (
                  <div
                    key={host.memberId}
                    className="flex flex-row items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
                  >
                    {/* שם בימין */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className="flex flex-col items-end">
                        <span className="text-base sm:text-lg font-medium text-right">{host.memberName}</span>
                        {host.memberNickname && (
                          <span className="text-muted-foreground text-xs sm:text-sm text-right">{host.memberNickname}</span>
                        )}
                      </div>
                    </div>
                    {/* אירועים בשמאל */}
                    <div className="flex items-center gap-2 shrink-0 justify-start">
                      <span className="text-xs sm:text-sm text-muted-foreground">אירועים</span>
                      <span className="text-xl sm:text-2xl font-bold text-primary">{host.eventCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Member Reports */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="text-right">דוחות לפי אנשים</CardTitle>
          <CardDescription className="text-right">סטטיסטיקה לכל חבר בחודש {monthYear}</CardDescription>
        </CardHeader>
        <CardContent className="text-right">
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין דוחות לחודש זה
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.memberId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  {/* Name on the right */}
                  <div className="flex-shrink-0 text-right w-full sm:w-auto">
                    <div className="flex flex-col items-end">
                      <div className="font-medium text-base sm:text-lg text-right">{report.memberName}</div>
                      {report.memberNickname && (
                        <div className="text-muted-foreground text-xs sm:text-sm text-right">
                          {report.memberNickname}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Events and paid on the left */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0 flex-1 w-full sm:w-auto justify-start">
                    {report.currentBalance !== undefined && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600 shrink-0">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span>יתרה: {report.currentBalance.toFixed(2)} ₪</span>
                      </div>
                    )}
                    {report.totalPaid > 0 && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-red-600 shrink-0">
                        <span>שולם: {report.totalPaid.toFixed(2)} ₪</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground shrink-0">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                      <span>{report.eventsAttended} אירועים</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;