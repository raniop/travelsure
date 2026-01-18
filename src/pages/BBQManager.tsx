import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Calendar, DollarSign, Settings, Copy, Check, LogOut, User as UserIcon, RefreshCw, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateEventDialog from "@/components/bbq/CreateEventDialog";
import EventsList from "@/components/bbq/EventsList";
import MembersList from "@/components/bbq/MembersList";
import PaymentsOverview from "@/components/bbq/PaymentsOverview";
import GroupSettings from "@/components/bbq/GroupSettings";
import UserSettings from "@/components/bbq/UserSettings";
import LoginDialog from "@/components/bbq/LoginDialog";
import Reports from "@/components/bbq/Reports";
import UsersList from "@/components/bbq/UsersList";
import BottomNavigation from "@/components/bbq/BottomNavigation";

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
  profile_image?: string;
}

const BBQManager = () => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events");
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false); // Will be set to true only if no user found
  const [userNotInGroup, setUserNotInGroup] = useState(false);
  const [checkingGroups, setCheckingGroups] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('bbq_current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Set user immediately from localStorage to avoid showing login screen
        setUser({
          ...userData,
          isAdmin: false,
          profile_image: userData.profile_image || undefined
        });
        setShowLogin(false);
        
        // Load user data from server to get latest profile_image (async, won't block)
        const loadUserFromServer = async () => {
          try {
            const serverUser = await apiClient.getUser(userData.id);
            if (serverUser) {
              // Update localStorage with latest data
              localStorage.setItem('bbq_current_user', JSON.stringify({
                ...userData,
                profile_image: serverUser.profile_image || userData.profile_image || null
              }));
              // Update user state with latest data
              setUser(prev => ({
                ...prev,
                ...serverUser,
                profile_image: serverUser.profile_image || prev.profile_image
              }));
            }
          } catch (error) {
            console.error("Error loading user from server:", error);
            // Continue with local data if server fails
          }
        };
        
        loadUserFromServer();
        // Load group
        loadGroup(userData.id, userData.phone);
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
              phone: updatedUser.phone,
              profile_image: updatedUser.profile_image || null
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

  // Check if user is in any group
  const checkUserInGroups = async (userPhone: string): Promise<Group | null> => {
    try {
      const groups = await apiClient.getGroups();
      
      if (!groups || groups.length === 0) {
        return null;
      }
      
      // Check each group for the user
      for (const group of groups) {
        try {
          const members = await apiClient.getMembers(group.id);
          const userMember = members.find((m: any) => m.phone === userPhone);
          
          if (userMember) {
            // User found in this group
            return group;
          }
        } catch (error) {
          console.error(`Error checking members in group ${group.id}:`, error);
          // Continue to next group
        }
      }
      
      // User not found in any group
      return null;
    } catch (error) {
      console.error("Error checking user in groups:", error);
      return null;
    }
  };

  const loadGroup = async (userId?: string, userPhone?: string) => {
    try {
      setLoading(true);
      setUserNotInGroup(false);
      
      // If user phone is provided, check if user is in any group
      if (userPhone) {
        const userGroup = await checkUserInGroups(userPhone);
        
        if (!userGroup) {
          // User not in any group
          setUserNotInGroup(true);
          setGroup(null);
          setLoading(false);
          return;
        }
        
        // User found in a group, load it
        const savedGroupId = localStorage.getItem('bbq_group_id');
        
        // If user is in the saved group, use it; otherwise use the found group
        let targetGroup = userGroup;
        if (savedGroupId && savedGroupId === userGroup.id) {
          targetGroup = userGroup;
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
        setUserNotInGroup(false);
        return;
      }
      
      // Fallback to old logic if no user phone provided
      const savedGroupId = localStorage.getItem('bbq_group_id') || 'default-group-001';
      const groups = await apiClient.getGroups();

      if (groups && groups.length > 0) {
        let targetGroup = groups.find(g => g.id === savedGroupId);
        
        if (!targetGroup) {
          targetGroup = groups.find(g => g.id === 'default-group-001');
        }
        
        if (!targetGroup) {
          targetGroup = groups[0];
        }
        
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
        
        localStorage.setItem('bbq_group_id', targetGroup.id);
        localStorage.setItem('bbq_current_group', JSON.stringify(targetGroup));
        setGroup(targetGroup);
      } else {
        setUserNotInGroup(true);
        setGroup(null);
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

  const handleRefreshCheck = async () => {
    if (!user) return;
    
    setCheckingGroups(true);
    try {
      await loadGroup(user.id, user.phone);
    } catch (error) {
      console.error("Error refreshing check:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לבדוק שוב. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    } finally {
      setCheckingGroups(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const newGroup = await apiClient.createGroup({
        name: "העל האש שלנו",
        description: "חבורת העל האש השבועית",
        owner_id: user.id
      });
      
      // Add user as member to the new group
      await apiClient.createMember({
        group_id: newGroup.id,
        name: user.name,
        phone: user.phone
      });
      
      localStorage.setItem('bbq_group_id', newGroup.id);
      localStorage.setItem('bbq_current_group', JSON.stringify(newGroup));
      setGroup(newGroup);
      setUserNotInGroup(false);
      
      toast({
        title: "הצלחה!",
        description: "הקבוצה נוצרה בהצלחה"
      });
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו ליצור קבוצה. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowLogin(false);
    setLoading(true);
    loadGroup(userData.id, userData.phone).then(() => {
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

  // Show "user not in group" screen if user is not in any group
  if (user && userNotInGroup && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">אינך נמצא בקבוצה</CardTitle>
            <CardDescription className="text-base mt-2 text-center">
              כרגע אינך רשום באף קבוצה. אתה יכול ליצור קבוצה חדשה או לחכות שמנהל קבוצה יוסיף אותך.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRefreshCheck}
                disabled={checkingGroups}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checkingGroups ? 'animate-spin' : ''}`} />
                {checkingGroups ? "בודק..." : "רענון"}
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={loading}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                צור קבוצה חדשה
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                התנתק
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading group message if user exists but no group yet (and not in "not in group" state)
  if (!group && !userNotInGroup) {
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
        <div className="mb-8 flex items-start justify-between w-full" style={{ flexDirection: 'row-reverse' }}>
          <div className="flex items-center gap-3">
            {user.profile_image ? (
              <img 
                src={user.profile_image} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-right">
              <div className="text-sm text-muted-foreground">שלום, {user.name}</div>
              {user.isAdmin && (
                <div className="text-xs text-primary font-semibold">מנהל</div>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600">{group.description}</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs - Hidden on Mobile */}
          <TabsList className={`hidden md:grid w-full ${user.isAdmin ? 'grid-cols-6' : 'grid-cols-5'} mb-6`} dir="rtl">
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
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              דוחות
            </TabsTrigger>
            {user.isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                משתמשים
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              הגדרות
            </TabsTrigger>
          </TabsList>

          {/* Mobile Bottom Navigation */}
          <BottomNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            isAdmin={user.isAdmin}
            hasUsersTab={true}
          />

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
              userId={user.id}
              isAdmin={user.isAdmin}
              onPaymentsCalculated={() => setActiveTab("payments")}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-4 pb-20 md:pb-4">
            <h2 className="text-2xl font-semibold mb-4">חברים קבועים</h2>
            <MembersList groupId={group.id} isAdmin={user.isAdmin} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 pb-20 md:pb-4">
            <h2 className="text-2xl font-semibold mb-4">
              {user.isAdmin ? "סקירת תשלומים (כל התשלומים)" : "התשלומים שלי"}
            </h2>
            <PaymentsOverview groupId={group.id} userId={user.id} isAdmin={user.isAdmin} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 pb-20 md:pb-4">
            <Reports groupId={group.id} />
          </TabsContent>

          {user.isAdmin && (
            <TabsContent value="users" className="space-y-4 pb-20 md:pb-4">
              <UsersList groupId={group.id} />
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-4 pb-20 md:pb-4">
            <div className="space-y-6">
              {/* User Settings - for all users */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">הגדרות פרופיל</h2>
                <UserSettings 
                  user={user} 
                  onUserUpdated={(updatedUser) => {
                    setUser(updatedUser);
                    // Update localStorage
                    localStorage.setItem('bbq_current_user', JSON.stringify({
                      id: updatedUser.id,
                      name: updatedUser.name,
                      phone: updatedUser.phone,
                      profile_image: updatedUser.profile_image
                    }));
                  }}
                  groupId={group?.id}
                />
              </div>

              {/* Group Settings - only for admins */}
              {user.isAdmin && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">הגדרות קבוצה</h2>
                  <GroupSettings group={group} onGroupUpdated={() => loadGroup(user.id)} />
                </div>
              )}

              {/* Logout Button */}
              <div>
                <Card>
                  <CardContent className="py-6">
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      התנתק
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BBQManager;
