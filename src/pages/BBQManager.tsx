import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Calendar, DollarSign, History, Settings, Copy, Check, LogOut, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateEventDialog from "@/components/bbq/CreateEventDialog";
import EventsList from "@/components/bbq/EventsList";
import MembersList from "@/components/bbq/MembersList";
import PaymentsOverview from "@/components/bbq/PaymentsOverview";
import GroupSettings from "@/components/bbq/GroupSettings";
import LoginDialog from "@/components/bbq/LoginDialog";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  owner_id?: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
}

const BBQManager = () => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events");
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true); // Start with login dialog open
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('bbq_current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Set user first (without isAdmin, will be updated when group loads)
        setUser({
          ...userData,
          isAdmin: false
        });
        // Load group
        loadGroup(userData.id);
      } catch {
        setLoading(false);
        setShowLogin(true);
      }
    } else {
      setLoading(false);
      setShowLogin(true);
    }
  }, []);

  // Update isAdmin when group changes and find user name from members list
  useEffect(() => {
    if (user && group) {
      const isAdmin = group.owner_id === user.id;
      console.log("Checking admin status:", {
        groupOwnerId: group.owner_id,
        userId: user.id,
        isAdmin: isAdmin,
        match: group.owner_id === user.id
      });
      
      // Find user name from members list by phone
      const findUserNameFromMembers = async () => {
        try {
          const members = await apiClient.getMembers(group.id);
          const userMember = members.find((m: any) => m.phone === user.phone);
          
          if (userMember && userMember.name && userMember.name !== user.name) {
            console.log("Found user in members list:", userMember.name);
            const updatedUser = {
              ...user,
              name: userMember.name,
              isAdmin: isAdmin
            };
            setUser(updatedUser);
            // Update localStorage
            localStorage.setItem('bbq_current_user', JSON.stringify({
              id: updatedUser.id,
              name: updatedUser.name,
              phone: updatedUser.phone
            }));
          } else if (user.isAdmin !== isAdmin) {
            // Only update isAdmin if name didn't change
            setUser({
              ...user,
              isAdmin
            });
          }
        } catch (error) {
          console.error("Error loading members:", error);
          // If error, just update isAdmin
          if (user.isAdmin !== isAdmin) {
            setUser({
              ...user,
              isAdmin
            });
          }
        }
      };
      
      findUserNameFromMembers();
    }
  }, [group, user]);

  const loadGroup = async (userId?: string) => {
    try {
      setLoading(true);
      
      // Try to load saved group ID from localStorage, or use default
      const savedGroupId = localStorage.getItem('bbq_group_id') || 'default-group-001';
      
      // Get all groups
      const groups = await apiClient.getGroups();

      if (groups && groups.length > 0) {
        // Try to find the saved/default group
        let targetGroup = groups.find(g => g.id === savedGroupId);
        
        // If not found, try default-group-001
        if (!targetGroup) {
          targetGroup = groups.find(g => g.id === 'default-group-001');
        }
        
        // If still not found, use the first group
        if (!targetGroup) {
          targetGroup = groups[0];
        }
        
        // If user is provided and group doesn't have owner_id, update it
        if (userId && !targetGroup.owner_id) {
          console.log("Group has no owner, updating to:", userId);
          try {
            const updatedGroup = await apiClient.updateGroup(targetGroup.id, {
              ...targetGroup,
              owner_id: userId
            });
            targetGroup = updatedGroup;
          } catch (error) {
            console.error("Failed to update group owner:", error);
          }
        }
        
        // Save the group ID for next time
        localStorage.setItem('bbq_group_id', targetGroup.id);
        localStorage.setItem('bbq_current_group', JSON.stringify(targetGroup));
        console.log("Loaded group:", {
          id: targetGroup.id,
          name: targetGroup.name,
          owner_id: targetGroup.owner_id,
          userId: userId
        });
        setGroup(targetGroup);
      } else {
        // Create default group only if no groups exist
        // If userId is provided, set as owner
        const newGroup = await apiClient.createGroup({
          name: "העל האש שלנו",
          description: "חבורת העל האש השבועית",
          owner_id: userId
        });
        localStorage.setItem('bbq_group_id', newGroup.id);
        localStorage.setItem('bbq_current_group', JSON.stringify(newGroup));
        setGroup(newGroup);
      }
    } catch (error: any) {
      console.error("Error loading group:", error);
      const errorMessage = error.message || "לא הצלחנו לטעון את הקבוצה. ודא שה-API endpoint עובד.";
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowLogin(false);
    setLoading(true);
    loadGroup(userData.id).then(() => {
      // isAdmin will be updated by the useEffect when group loads
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading group after login:", error);
      // Still allow user to proceed even if group fails
      setLoading(false);
      toast({
        title: "אזהרה",
        description: "התחברת בהצלחה, אבל לא הצלחנו לטעון את הקבוצה. נסה לרענן את הדף.",
        variant: "destructive"
      });
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('bbq_current_user');
    setUser(null);
    setShowLogin(true);
  };

  // Show loading only if we're loading AND we have a user (not during initial login check)
  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Show login dialog if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center" dir="rtl">
        <LoginDialog 
          open={showLogin} 
          onOpenChange={(open) => {
            setShowLogin(open);
            // If user tries to close login, don't allow it (must login)
            if (!open && !user) {
              setShowLogin(true);
            }
          }}
          onLogin={handleLogin}
          groupOwnerId={group?.owner_id}
        />
      </div>
    );
  }

  // Show loading group message if user exists but no group yet
  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">טוען קבוצה...</CardTitle>
            <CardDescription className="text-base mt-2">
              אנא המתן
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600">{group.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">שלום, {user.name}</div>
              {user.isAdmin && (
                <div className="text-xs text-primary font-semibold">מנהל</div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              התנתק
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              אירועים
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              חברים
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              תשלומים
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              הגדרות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">אירועים</h2>
              {user.isAdmin && (
                <CreateEventDialog groupId={group.id} onEventCreated={() => loadGroup(user.id)}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    אירוע חדש
                  </Button>
                </CreateEventDialog>
              )}
            </div>
            <EventsList 
              groupId={group.id} 
              onPaymentsCalculated={() => setActiveTab("payments")}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">חברים קבועים</h2>
            {user.isAdmin ? (
              <MembersList groupId={group.id} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  רק מנהל הקבוצה יכול לראות ולנהל חברים
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">
              {user.isAdmin ? "סקירת תשלומים (כל התשלומים)" : "התשלומים שלי"}
            </h2>
            <PaymentsOverview groupId={group.id} userId={user.id} isAdmin={user.isAdmin} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">היסטוריית תשלומים</h2>
            <EventsList 
              groupId={group.id} 
              showHistory={true}
              onPaymentsCalculated={() => setActiveTab("payments")}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {user.isAdmin ? (
              <>
                <h2 className="text-2xl font-semibold mb-4">הגדרות קבוצה</h2>
                <GroupSettings group={group} onGroupUpdated={() => loadGroup(user.id)} />
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  רק מנהל הקבוצה יכול לשנות הגדרות
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BBQManager;
