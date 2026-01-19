import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, ExternalLink, Wallet, TrendingDown, TrendingUp, Coins, Calendar, ArrowDownRight, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";

interface Payment {
  id: string;
  amount: number;
  payment_status: string;
  payer_type: string;
  payer_id: string;
  event: {
    id: string;
    event_date: string;
    total_cost: number;
  };
  payer_name?: string;
  paid_by_phone?: string;
  paid_by_name?: string;
  paid_at?: string;
  paybox_payment_id?: string;
}

interface PaymentsOverviewProps {
  groupId: string;
  userId?: string;
  isAdmin?: boolean;
}

const PaymentsOverview = ({ groupId, userId, isAdmin = false }: PaymentsOverviewProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0
  });
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [totalDeposited, setTotalDeposited] = useState<number>(0);
  const [totalGuestPayments, setTotalGuestPayments] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadPayments = async () => {
    try {
      setLoading(true);

      // Get all events for this group
      const events = await apiClient.getEvents(groupId);

      if (!events || events.length === 0) {
        setPayments([]);
        setSummary({ total: 0, paid: 0, pending: 0 });
        return;
      }

      // Load all payments for all events
      const allPayments = await Promise.all(
        events.map(e => apiClient.getPayments(e.id))
      );
      const paymentsData = allPayments.flat();
      
      // Debug: log all payments to see what we have
      console.log("All payments loaded:", paymentsData);
      console.log("Payment statuses:", paymentsData.map((p: any) => ({ 
        id: p.id, 
        payer_type: p.payer_type, 
        payment_status: p.payment_status, 
        amount: p.amount 
      })));
      
      // Check which events are future events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureEventIds = events
        .filter(e => {
          const eventDate = new Date(e.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        })
        .map(e => e.id);
      
      // Filter to show deducted payments OR all payments for future events
      const deductedPayments = paymentsData.filter((p: any) => {
        // For future events, show all payments
        if (futureEventIds.includes(p.event_id)) {
          return true;
        }
        // For past events, only show deducted payments
        return p.payment_status === "deducted";
      });
      
      // Enrich with event and payer names
      const members = await apiClient.getMembers(groupId);
      
      // Load users for profile images
      let usersWithImages: any[] = [];
      try {
        usersWithImages = await apiClient.getUsers();
      } catch (userError) {
        console.error("Error loading users for profile images:", userError);
      }
      
      let enrichedPayments = await Promise.all(
        deductedPayments.map(async (payment: any) => {
          let payerName = "לא ידוע";
          let profileImage: string | null = null;
          const event = events.find(e => e.id === payment.event_id);

          if (payment.payer_type === "member") {
            const member = members.find(m => m.id === payment.payer_id);
            if (member) {
              payerName = member.name;
              // Find matching user by phone to get profile image
              if (member.phone) {
                const user = usersWithImages.find((u: any) => u.phone === member.phone);
                if (user && user.profile_image) {
                  profileImage = user.profile_image;
                }
              }
            }
          } else if (payment.payer_type === "guest") {
            // For guests, we need to get from the event
            if (event) {
              const guests = await apiClient.getGuests(event.id);
              const guest = guests.find(g => g.id === payment.payer_id);
              if (guest) payerName = guest.name;
            }
          }

          // Find who actually paid (if different from payer)
          let paidByName = null;
          if (payment.paid_by_phone && payment.paid_by_phone !== payment.payer_id) {
            // Try to find by phone in members
            const paidByMember = members.find(m => m.phone === payment.paid_by_phone);
            if (paidByMember) {
              paidByName = paidByMember.nickname ? `${paidByMember.name} - ${paidByMember.nickname}` : paidByMember.name;
            } else if (event) {
              // Try to find in guests
              const guests = await apiClient.getGuests(event.id);
              const paidByGuest = guests.find(g => g.phone === payment.paid_by_phone);
              if (paidByGuest) {
                paidByName = paidByGuest.name;
              }
            }
            // If not found, use phone number
            if (!paidByName) {
              paidByName = payment.paid_by_phone;
            }
          }

          return {
            ...payment,
            payer_name: payerName,
            paid_by_name: paidByName,
            profile_image: profileImage,
            event: event ? {
              id: event.id,
              event_date: event.event_date,
              total_cost: event.total_cost,
              butcher_cost: event.butcher_cost,
              grocery_cost: event.grocery_cost,
              description: event.description
            } : null
          };
        })
      );

      // Filter payments by user if not admin - only show payments for events user attended
      if (!isAdmin && userId) {
        const userData = JSON.parse(localStorage.getItem('bbq_current_user') || '{}');
        
        // Get all members to find user's member_id
        const members = await apiClient.getMembers(groupId);
        const userMember = members.find((m: any) => m.phone === userData.phone);
        
        if (!userMember) {
          // If user is not a member, show no payments
          setPayments([]);
          setSummary({ total: 0, paid: 0, pending: 0 });
          return;
        }
        
        const userMemberId = userMember.id;
        
        // Check which events the user attended, and also get future events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventsUserAttended = await Promise.all(
          events.map(async (event) => {
            try {
              const eventDate = new Date(event.event_date);
              eventDate.setHours(0, 0, 0, 0);
              const isFutureEvent = eventDate >= today;
              
              // For future events, include them if user is a member
              if (isFutureEvent) {
                return event.id;
              }
              
              // For past events, only include if user attended
              const attendees = await apiClient.getAttendees(event.id);
              const userAttended = attendees.some((a: any) => a.member_id === userMemberId && a.attended);
              return userAttended ? event.id : null;
            } catch {
              return null;
            }
          })
        );
        
        const attendedEventIds = eventsUserAttended.filter(id => id !== null);
        
        // Get all guests for all events (including future events) to check guest payments
        const allGuestsForEvents = await Promise.all(
          events
            .filter(e => attendedEventIds.includes(e.id))
            .map(async (event) => {
              try {
                const guests = await apiClient.getGuests(event.id);
                return { eventId: event.id, guests };
              } catch {
                return { eventId: event.id, guests: [] };
              }
            })
        );
        
        const guestsByEvent = allGuestsForEvents.reduce((acc, item) => {
          acc[item.eventId] = item.guests;
          return acc;
        }, {} as Record<string, any[]>);
        
        // Filter payments - show payments for events user attended OR future events with payments
        enrichedPayments = enrichedPayments.filter((payment: any) => {
          // Check if this is a future event
          const paymentEvent = events.find(e => e.id === payment.event_id);
          let isFutureEvent = false;
          
          if (paymentEvent) {
            const eventDate = new Date(paymentEvent.event_date);
            eventDate.setHours(0, 0, 0, 0);
            isFutureEvent = eventDate >= today;
          }
          
          // For future events, show all payments for this user (member)
          if (isFutureEvent) {
            // Show payments for this user (member)
            if (payment.payer_type === "member" && userMember) {
              return payment.payer_id === userMember.id;
            }
            
            // For guests in future events, try to get guests for this event
            if (payment.payer_type === "guest") {
              // Try to get guests for this event if not already loaded
              const eventGuests = guestsByEvent[payment.event_id] || [];
              const matchingGuest = eventGuests.find(g => g.id === payment.payer_id && g.phone === userData.phone);
              return !!matchingGuest;
            }
            
            return false;
          }
          
          // For past events, only show payments for events user attended
          if (!attendedEventIds.includes(payment.event_id)) {
            return false;
          }
          
          // Show payments for this user (member or guest)
          if (payment.payer_type === "member" && userMember) {
            return payment.payer_id === userMember.id;
          }
          
          // For guests, check if guest phone matches user phone
          if (payment.payer_type === "guest") {
            const eventGuests = guestsByEvent[payment.event_id] || [];
            const matchingGuest = eventGuests.find(g => g.id === payment.payer_id && g.phone === userData.phone);
            return !!matchingGuest;
          }
          
          return false;
        });
      }

      // Sort by created_at descending
      enrichedPayments.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setPayments(enrichedPayments);

      // Calculate summary - use all payments (paymentsData) not just filtered ones
      // Pending = guest payments with status "pending"
      const pending = paymentsData
        .filter(p => p.payer_type === "guest" && p.payment_status === "pending")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Deducted = ALL member payments (because they are always deducted from balance when created)
      // This includes payments with status "deducted", "pending", "confirmed", or any other status
      // The only exception is "paid" which means it was paid separately (not from balance)
      const memberPayments = paymentsData.filter((p: any) => p.payer_type === "member");
      const deductedPaymentsFiltered = memberPayments.filter((p: any) => {
        // All member payments are deducted from balance (except if explicitly marked as "paid")
        if (p.payment_status !== "paid") {
          return true;
        }
        return false;
      });
      
      // Calculate sums with proper rounding to avoid floating point precision issues
      const deducted = deductedPaymentsFiltered.reduce((sum, p) => {
        const amount = parseFloat((p.amount || 0).toFixed(2));
        return parseFloat((sum + amount).toFixed(2));
      }, 0);
      
      const paid = paymentsData
        .filter(p => p.payment_status === "paid")
        .reduce((sum, p) => {
          const amount = parseFloat((p.amount || 0).toFixed(2));
          return parseFloat((sum + amount).toFixed(2));
        }, 0);
      
      // Total = ALL payments (members + guests, all statuses)
      // This includes all payments regardless of payer_type or payment_status
      // Use proper rounding to avoid floating point precision issues
      const total = paymentsData.reduce((sum, p) => {
        const amount = parseFloat((p.amount || 0).toFixed(2));
        return parseFloat((sum + amount).toFixed(2));
      }, 0);
      
      // Round to 2 decimal places for display
      // If the result is very close to a whole number (within 0.05), round to whole number
      // This handles cases like 1874.04 -> 1874.00
      let roundedTotal = parseFloat(total.toFixed(2));
      const nearestWholeTotal = Math.round(total);
      const differenceTotal = Math.abs(total - nearestWholeTotal);
      
      // If very close to whole number (within 0.05), round to whole number
      if (differenceTotal <= 0.05) {
        roundedTotal = nearestWholeTotal;
      }

      // Debug log
      console.log("Payment summary calculation:", {
        totalPayments: paymentsData.length,
        paymentsData: paymentsData,
        byStatus: paymentsData.reduce((acc: any, p: any) => {
          acc[p.payment_status] = (acc[p.payment_status] || 0) + 1;
          return acc;
        }, {}),
        byType: paymentsData.reduce((acc: any, p: any) => {
          acc[p.payer_type] = (acc[p.payer_type] || 0) + 1;
          return acc;
        }, {}),
        memberPayments: memberPayments,
        memberPaymentsCount: memberPayments.length,
        deductedPaymentsFiltered: deductedPaymentsFiltered,
        deductedPaymentsCount: deductedPaymentsFiltered.length,
        guestPayments: paymentsData.filter((p: any) => p.payer_type === "guest"),
        calculated: { total, deducted, pending, paid }
      });

      setSummary({ total: roundedTotal, paid, pending });

      // Calculate total guest payments (all guest payments regardless of status)
      const guestPaymentsTotal = paymentsData
        .filter((p: any) => p.payer_type === "guest")
        .reduce((sum, p) => {
          return sum + (p.amount || 0);
        }, 0);
      
      setTotalGuestPayments(guestPaymentsTotal);

      // Load current balance for the logged-in user and calculate total deposited
      try {
        const members = await apiClient.getMembers(groupId);
        
        if (!isAdmin && userId) {
          const userData = JSON.parse(localStorage.getItem('bbq_current_user') || '{}');
          const userMember = members.find((m: any) => m.phone === userData.phone);
          if (userMember) {
            // Use exact balance value, but round for display
            const balance = userMember.balance !== undefined && userMember.balance !== null
              ? (typeof userMember.balance === 'string' ? parseFloat(userMember.balance) : userMember.balance)
              : 0;
            // Round to 2 decimal places for display (but keep exact value in calculation)
            const roundedBalance = parseFloat(balance.toFixed(2));
            setCurrentBalance(roundedBalance);
          } else {
            setCurrentBalance(0);
          }
        } else if (isAdmin) {
          // For admin, show total balance of all members
          // Use proper rounding to avoid floating point precision issues
          let totalBalance = 0;
          for (const m of members) {
            if (m.balance !== undefined && m.balance !== null) {
              const balance = typeof m.balance === 'string' ? parseFloat(m.balance) : m.balance;
              const roundedBalance = parseFloat(balance.toFixed(2));
              totalBalance = parseFloat((totalBalance + roundedBalance).toFixed(2));
            }
          }
          // Round to 2 decimal places for display
          // If the result is very close to a whole number (within 0.05), round to whole number
          let finalTotalBalance = parseFloat(totalBalance.toFixed(2));
          const nearestWhole = Math.round(totalBalance);
          const difference = Math.abs(totalBalance - nearestWhole);
          if (difference <= 0.05) {
            finalTotalBalance = nearestWhole;
          }
          
          // Store the raw balance for later auto-fix calculation
          const rawTotalBalance = totalBalance;
          
          setCurrentBalance(finalTotalBalance);
        } else {
          setCurrentBalance(0);
        }
        
        // Calculate total deposited = current balance + total deducted
        // This represents what was originally deposited (before deductions)
        // Use exact values for calculation (no rounding)
        let currentBalanceForCalc = 0;
        if (isAdmin) {
          // For admin, use total balance of all members
          // Use proper rounding to avoid floating point precision issues
          for (const m of members) {
            if (m.balance !== undefined && m.balance !== null) {
              const balance = typeof m.balance === 'string' ? parseFloat(m.balance) : m.balance;
              const roundedBalance = parseFloat(balance.toFixed(2));
              currentBalanceForCalc = parseFloat((currentBalanceForCalc + roundedBalance).toFixed(2));
            }
          }
        } else if (userId) {
          const userData = JSON.parse(localStorage.getItem('bbq_current_user') || '{}');
          const userMember = members.find((m: any) => m.phone === userData.phone);
          if (userMember) {
            currentBalanceForCalc = userMember.balance !== undefined && userMember.balance !== null
              ? (typeof userMember.balance === 'string' ? parseFloat(userMember.balance) : userMember.balance)
              : 0;
          }
        }
        
        // Total deposited = current balance + deducted (from members only)
        // This represents what was originally deposited by members (before deductions)
        // Guest payments are NOT deposits - they are separate payments for events
        // Use exact values (no rounding in calculation)
        // IMPORTANT: Only count member payments that were deducted from balance
        // Make sure we're only counting member payments, not guest payments
        // Use proper rounding to avoid floating point precision issues
        const memberDeductedOnly = deductedPaymentsFiltered
          .filter((p: any) => p.payer_type === "member")
          .reduce((sum, p) => {
            const amount = parseFloat((p.amount || 0).toFixed(2));
            return parseFloat((sum + amount).toFixed(2));
          }, 0);
        
        // currentBalanceForCalc is already rounded to 2 decimal places
        // memberDeductedOnly is already rounded to 2 decimal places
        // So we can just add them and round the result
        const totalDepositedCalc = parseFloat((currentBalanceForCalc + memberDeductedOnly).toFixed(2));
        
        // Debug log to see what's happening
        console.log("Total Deposited Calculation:", {
          currentBalanceForCalc,
          deducted,
          memberDeductedOnly,
          totalDepositedCalc,
          membersCount: members.length,
          membersBalances: members.map((m: any) => ({ 
            name: m.name, 
            balance: m.balance,
            roundedBalance: parseFloat((m.balance || 0).toFixed(2))
          })),
          sumOfBalances: members.reduce((sum, m) => {
            const balance = typeof m.balance === 'string' ? parseFloat(m.balance) : (m.balance || 0);
            return parseFloat((sum + parseFloat(balance.toFixed(2))).toFixed(2));
          }, 0),
          deductedPayments: deductedPaymentsFiltered.map((p: any) => ({ 
            amount: p.amount,
            roundedAmount: parseFloat((p.amount || 0).toFixed(2)),
            status: p.payment_status,
            payer_type: p.payer_type 
          }))
        });
        
        // Round to 2 decimal places for display
        // If the result is very close to a whole number (within 0.05), round to whole number
        // This handles cases like 5000.03 -> 5000.00 or 5000.02 -> 5000.00
        let finalTotalDeposited = parseFloat(totalDepositedCalc.toFixed(2));
        const nearestWhole = Math.round(totalDepositedCalc);
        const difference = Math.abs(totalDepositedCalc - nearestWhole);
        
        // If very close to whole number (within 0.05), round to whole number
        if (difference <= 0.05) {
          finalTotalDeposited = nearestWhole;
        }
        
        setTotalDeposited(finalTotalDeposited);

        // AUTO-FIX: Always check and fix balances if needed
        // If totalDeposited is very close to a round number (like 5000.03 -> 5000.00),
        // recalculate and fix balances automatically
        if (isAdmin && nearestWhole > 0 && difference <= 0.05) {
          // Calculate what the correct current balance should be
          // Use the rounded totalDeposited (nearestWhole) minus memberDeductedOnly
          const correctCurrentBalance = parseFloat((nearestWhole - memberDeductedOnly).toFixed(2));
          const actualCurrentBalance = parseFloat(currentBalanceForCalc.toFixed(2));
          const balanceDifference = Math.abs(actualCurrentBalance - correctCurrentBalance);
          
          // If there's a difference (even small like 0.03), fix the balances
          // This ensures balances are always correct based on deposits and deductions
          if (balanceDifference > 0.001) {
            console.log("Auto-fixing balances:", {
              correctCurrentBalance,
              actualCurrentBalance,
              balanceDifference,
              totalDeposited: nearestWhole,
              memberDeductedOnly
            });
            
            // Calculate the correction factor
            const correctionFactor = correctCurrentBalance - actualCurrentBalance;
            
            // Distribute the correction proportionally among all members
            try {
              const freshMembers = await apiClient.getMembers(groupId);
              const totalCurrentBalance = freshMembers.reduce((sum, m) => {
                const balance = typeof m.balance === 'string' ? parseFloat(m.balance) : (m.balance || 0);
                return sum + parseFloat(balance.toFixed(2));
              }, 0);
              
              if (totalCurrentBalance > 0 && Math.abs(correctionFactor) > 0.001) {
                // Calculate the target total balance
                const targetTotalBalance = correctCurrentBalance;
                
                // Adjust each member's balance proportionally to reach the target
                // We'll update all members to ensure the total matches
                let totalAdjusted = 0;
                const updates: Array<{id: string, balance: number}> = [];
                
                for (let i = 0; i < freshMembers.length; i++) {
                  const member = freshMembers[i];
                  const currentBalance = typeof member.balance === 'string' 
                    ? parseFloat(member.balance) 
                    : (member.balance || 0);
                  
                  if (currentBalance > 0) {
                    // Calculate proportional adjustment
                    const proportion = currentBalance / totalCurrentBalance;
                    const targetBalance = targetTotalBalance * proportion;
                    const newBalance = parseFloat(targetBalance.toFixed(2));
                    
                    // For the last member, adjust to ensure exact total
                    if (i === freshMembers.length - 1) {
                      const remainingBalance = parseFloat((targetTotalBalance - totalAdjusted).toFixed(2));
                      updates.push({ id: member.id, balance: remainingBalance });
                    } else {
                      updates.push({ id: member.id, balance: newBalance });
                      totalAdjusted = parseFloat((totalAdjusted + newBalance).toFixed(2));
                    }
                  }
                }
                
                // Apply all updates
                for (const update of updates) {
                  const member = freshMembers.find(m => m.id === update.id);
                  if (member) {
                    await apiClient.updateMember(member.id, {
                      ...member,
                      balance: update.balance
                    });
                  }
                }
                
                // Wait a bit for the updates to complete
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Reload members to get updated balances
                const updatedMembers = await apiClient.getMembers(groupId);
                let fixedTotalBalance = 0;
                for (const m of updatedMembers) {
                  if (m.balance !== undefined && m.balance !== null) {
                    const balance = typeof m.balance === 'string' ? parseFloat(m.balance) : m.balance;
                    const roundedBalance = parseFloat(balance.toFixed(2));
                    fixedTotalBalance = parseFloat((fixedTotalBalance + roundedBalance).toFixed(2));
                  }
                }
                
                // Round the fixed balance if needed
                const nearestWholeFixed = Math.round(fixedTotalBalance);
                const differenceFixed = Math.abs(fixedTotalBalance - nearestWholeFixed);
                if (differenceFixed <= 0.05) {
                  fixedTotalBalance = nearestWholeFixed;
                }
                
                // Update current balance display
                setCurrentBalance(fixedTotalBalance);
                
                console.log("Balances auto-fixed:", {
                  oldTotal: actualCurrentBalance,
                  newTotal: fixedTotalBalance,
                  correction: correctionFactor,
                  expected: correctCurrentBalance,
                  updatesCount: updates.length
                });
              }
            } catch (fixError) {
              console.error("Error auto-fixing balances:", fixError);
            }
          } else {
            // Even if difference is small, if balance is close to whole number, round it
            const nearestWholeBalance = Math.round(actualCurrentBalance);
            const differenceBalance = Math.abs(actualCurrentBalance - nearestWholeBalance);
            if (differenceBalance <= 0.05) {
              setCurrentBalance(nearestWholeBalance);
            }
          }
        }
      } catch (balanceError) {
        console.error("Error loading balance:", balanceError);
        setCurrentBalance(0);
      }
    } catch (error: any) {
      console.error("Error loading payments:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את התשלומים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      toast({
        title: "שגיאה",
        description: "תשלום לא נמצא",
        variant: "destructive"
      });
      return;
    }

    // Save old values for rollback
    const oldSummary = { ...summary };
    const oldPayments = [...payments];

    // Optimistic update - update UI immediately
    const updatedPayment = {
      ...payment,
      payment_status: "paid",
      paid_at: new Date().toISOString()
    };
    
    setPayments(prevPayments => 
      prevPayments.map(p => p.id === paymentId ? updatedPayment : p)
    );

    // Update summary immediately
    const newTotal = summary.total;
    const newPaid = summary.paid + payment.amount;
    const newPending = summary.pending - payment.amount;
    setSummary({ total: newTotal, paid: newPaid, pending: newPending });

    // Update server in background
    try {
      await apiClient.updatePayment(paymentId, updatedPayment);
      
      toast({
        title: "הצלחה!",
        description: "התשלום סומן כמשולם"
      });
    } catch (error: any) {
      // Rollback on error
      setPayments(oldPayments);
      setSummary(oldSummary);
      
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את התשלום",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען תשלומים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 w-full" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      {/* Header */}
      <div className="flex items-center justify-end w-full mb-4" dir="rtl" style={{ direction: "rtl" }}>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent text-right ml-auto">
          תשלומים
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Deposited */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-bold text-right">סה״כ שהופקד</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1 text-right">
              <span dir="ltr" className="tabular-nums">
                {isAdmin ? totalDeposited.toFixed(2) : (currentBalance !== null && currentBalance > 0 ? currentBalance.toFixed(2) : "0.00")}
              </span> שקל
            </div>
            <p className="text-sm text-muted-foreground text-right">
              {isAdmin ? "סך הכל שהופקד על ידי כל החברים" : "סך הכל שהופקד על ידך"}
            </p>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card className={`relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 ${currentBalance !== null && currentBalance < 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10' : 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10'}`}>
          <div className={`absolute top-0 right-0 w-full h-1 ${currentBalance !== null && currentBalance < 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className={`p-2 rounded-lg ${currentBalance !== null && currentBalance < 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                <Wallet className={`w-5 h-5 ${currentBalance !== null && currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <CardTitle className="text-lg font-bold text-right">יתרה נוכחית</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-1 text-right ${currentBalance !== null && currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {currentBalance !== null ? (
                <span dir="ltr" className="tabular-nums">
                  {Math.abs(currentBalance).toFixed(2)}
                </span>
              ) : (
                "טוען..."
              )}
              {" "}שקל
            </div>
            <p className="text-sm text-muted-foreground text-right">
              {isAdmin ? "סה\"כ יתרה" : "היתרה שלך"}
            </p>
          </CardContent>
        </Card>

        {/* Total Payments */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg font-bold text-right">סה״כ תשלומים</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1 text-right">
              <span dir="ltr" className="tabular-nums">{summary.total.toFixed(2)}</span> שקל
            </div>
            <p className="text-sm text-muted-foreground text-right">
              סך הכל תשלומים שנוצרו
            </p>
          </CardContent>
        </Card>

        {/* Guest Payments */}
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between" dir="rtl" style={{ direction: "rtl" }}>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <UserPlus className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg font-bold text-right">תשלומי אורחים</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1 text-right">
              <span dir="ltr" className="tabular-nums">{totalGuestPayments.toFixed(2)}</span> שקל
            </div>
            <p className="text-sm text-muted-foreground text-right">
              סך הכל תשלומים של אורחים
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List - Grouped by Event */}
      <div>
        <div className="mb-6" dir="rtl" style={{ direction: "rtl" }}>
          <h3 className="text-lg md:text-xl font-semibold text-right">רשימת תשלומים</h3>
        </div>

        {payments.length === 0 ? (
          <Card className="border-2 shadow-md">
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Wallet className="w-12 h-12 text-primary opacity-50" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">עדיין אין תשלומים</h3>
                  <p className="text-muted-foreground">תשלומים יופיעו כאן לאחר יצירת אירועים</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          (() => {
            // Group payments by event
            const paymentsByEvent = payments.reduce((acc, payment) => {
              const eventId = payment.event?.id || 'unknown';
              if (!acc[eventId]) {
                acc[eventId] = {
                  event: payment.event,
                  payments: []
                };
              }
              acc[eventId].payments.push(payment);
              return acc;
            }, {} as Record<string, { event: any; payments: Payment[] }>);

            // Sort events by date (newest first)
            const sortedEvents = Object.values(paymentsByEvent).sort((a, b) => {
              const dateA = new Date(a.event?.event_date || 0).getTime();
              const dateB = new Date(b.event?.event_date || 0).getTime();
              return dateB - dateA;
            });

            return (
              <div className="space-y-4">
                {sortedEvents.map((eventGroup) => {
                  const eventDate = new Date(eventGroup.event?.event_date || 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const eventDateOnly = new Date(eventDate);
                  eventDateOnly.setHours(0, 0, 0, 0);
                  const isFutureEvent = eventDateOnly >= today;
                  
                  const eventDeducted = eventGroup.payments
                    .filter(p => p.payment_status === "deducted")
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                  
                  // Check if event has deducted payments
                  const hasDeductedPayments = eventGroup.payments.some(p => p.payment_status === "deducted");
                  
                  // Check if event has any payments (for future events, show even if not deducted yet)
                  const hasPayments = eventGroup.payments.length > 0;
                  
                  // Only show if there are deducted payments (for past events) OR any payments (for future events)
                  if (!hasDeductedPayments && !isFutureEvent) {
                    return null;
                  }
                  
                  // For future events, show if there are any payments
                  if (isFutureEvent && !hasPayments) {
                    return null;
                  }
                  
                  const event = eventGroup.event;
                  const totalCost = (event?.butcher_cost || 0) + (event?.grocery_cost || 0) || (event?.total_cost || 0);

                  return (
                    <Card key={eventGroup.event?.id || 'unknown'} className="relative overflow-hidden border-2 shadow-md hover:shadow-lg transition-all duration-200" dir="rtl">
                      {/* Top accent bar */}
                      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4" dir="rtl" style={{ direction: "rtl" }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-950/30">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg md:text-xl font-bold truncate">
                                  {format(eventDate, "EEEE, d בMMMM yyyy", { locale: he })}
                                </CardTitle>
                                {eventGroup.event?.description && (
                                  <CardDescription className="mt-1 text-sm text-right line-clamp-2">
                                    {eventGroup.event.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            
                            {/* Event Summary */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                <Coins className="w-4 h-4 text-blue-600" />
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-muted-foreground leading-tight">עלות אירוע</span>
                                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                    <span dir="ltr" className="tabular-nums">{totalCost.toFixed(2)}</span> שקל
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20">
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-muted-foreground leading-tight">נקזז</span>
                                  <span className="text-sm font-bold text-red-700 dark:text-red-400">
                                    <span dir="ltr" className="tabular-nums">{eventDeducted.toFixed(2)}</span> שקל
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-3">
                          {eventGroup.payments
                            .filter((p: any) => p.payment_status === "deducted")
                            .map((payment, index) => {
                            return (
                              <div
                                key={payment.id}
                                className="group relative p-4 rounded-xl border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background via-background to-muted/20"
                                style={{ animationDelay: `${index * 50}ms` }}
                                dir="rtl"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  {/* LEFT: Amount */}
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" dir="rtl">
                                    <div className="flex flex-col items-end">
                                      <span className="text-xs text-muted-foreground">סכום</span>
                                      <span className="text-sm md:text-base font-bold">
                                        <span dir="ltr" className="tabular-nums">{payment.amount.toFixed(2)}</span> שקל
                                      </span>
                                    </div>
                                    <TrendingDown className="w-4 h-4 shrink-0" />
                                  </div>

                                  {/* RIGHT: Member info (pinned to the right edge) */}
                                  <div className="flex items-center gap-2 ml-auto" dir="rtl" style={{ direction: "rtl" }}>
                                    <Avatar className="w-12 h-12 shrink-0">
                                      {(payment as any).profile_image ? (
                                        <AvatarImage src={(payment as any).profile_image} alt={payment.payer_name} />
                                      ) : null}
                                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                                        {payment.payer_name?.charAt(0).toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-end text-right" dir="rtl" style={{ direction: "rtl" }}>
                                      <div className="font-semibold text-base md:text-lg text-right">{payment.payer_name}</div>
                                      <Badge variant="default" className="bg-blue-600 text-xs mt-1">
                                        {isFutureEvent ? "נקזז מהיתרה" : "קוזז מהיתרה"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default PaymentsOverview;
