import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Calendar, DollarSign, Settings, Copy, Check, LogOut, User as UserIcon, RefreshCw, BarChart3, MessageSquare } from "lucide-react";
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
import InstallPrompt from "@/components/bbq/InstallPrompt";
import GroupsDashboard from "@/components/bbq/GroupsDashboard";
import PollsList from "@/components/bbq/PollsList";
import { usePWAConfig } from "@/hooks/usePWAConfig";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  owner_id?: string;
  group_image?: string | null;
}

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  profile_image?: string;
}

const BBQManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events");
  const [membersRefreshTrigger, setMembersRefreshTrigger] = useState(0);
  const [eventsRefreshTrigger, setEventsRefreshTrigger] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false); // Will be set to true only if no user found
  const [showDashboard, setShowDashboard] = useState(false);
  const [userNotInGroup, setUserNotInGroup] = useState(false);
  const [checkingGroups, setCheckingGroups] = useState(false);
  const { toast } = useToast();

  // Update PWA config with group name and image (must be before any conditional returns)
  usePWAConfig({
    name: group?.name || "כלי לניהול קבוצות ותשלומים",
    groupImage: group?.group_image || null
  });

  // Read URL parameters on mount and when they change
  useEffect(() => {
    const groupIdFromUrl = searchParams.get('group');
    const tabFromUrl = searchParams.get('tab');
    
    // If tab is in URL and different from current, set it
    if (tabFromUrl && ['events', 'members', 'payments', 'polls', 'reports', 'users', 'settings'].includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    
    // If group ID is in URL and we don't have a group loaded (or different group), try to load it
    if (groupIdFromUrl && user && (!group || group.id !== groupIdFromUrl)) {
      const loadGroupFromUrl = async () => {
        try {
          const groups = await apiClient.getGroups();
          const foundGroup = groups.find(g => g.id === groupIdFromUrl);
          if (foundGroup) {
            // Check if user is a member
            const members = await apiClient.getMembers(foundGroup.id);
            const isMember = members.some((m: any) => m.phone === user.phone);
            if (isMember) {
              setGroup(foundGroup);
              setShowDashboard(false);
              localStorage.setItem('bbq_group_id', foundGroup.id);
              localStorage.setItem('bbq_current_group', JSON.stringify(foundGroup));
            }
          }
        } catch (error) {
          console.error("Error loading group from URL:", error);
        }
      };
      loadGroupFromUrl();
    }
  }, [searchParams, user, group, activeTab]);

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
        // Show dashboard instead of loading group directly
        setShowDashboard(true);
        setGroup(null);
        setLoading(false);
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

  // Refresh members list when switching to members tab
  useEffect(() => {
    if (activeTab === "members" && group) {
      setMembersRefreshTrigger(prev => prev + 1);
    }
  }, [activeTab, group]);

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
        // Update URL with group ID
        const newParams = new URLSearchParams();
        newParams.set('group', targetGroup.id);
        if (activeTab) {
          newParams.set('tab', activeTab);
        }
        setSearchParams(newParams, { replace: true });
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
        // Update URL with group ID
        const newParams = new URLSearchParams();
        newParams.set('group', targetGroup.id);
        if (activeTab) {
          newParams.set('tab', activeTab);
        }
        setSearchParams(newParams, { replace: true });
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
        name: "הקבוצה שלנו",
        description: "קבוצה חדשה לניהול תשלומים ואירועים",
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
    setLoading(false);
    setShowDashboard(true);
    setGroup(null);
  };

  const handleSelectGroup = (selectedGroup: Group) => {
    setGroup(selectedGroup);
    setShowDashboard(false);
    localStorage.setItem('bbq_group_id', selectedGroup.id);
    localStorage.setItem('bbq_current_group', JSON.stringify(selectedGroup));
    // Update URL with group ID
    const newParams = new URLSearchParams();
    newParams.set('group', selectedGroup.id);
    if (activeTab) {
      newParams.set('tab', activeTab);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleBackToDashboard = () => {
    setGroup(null);
    setShowDashboard(true);
    localStorage.removeItem('bbq_group_id');
    localStorage.removeItem('bbq_current_group');
    // Clear URL parameters
    setSearchParams({}, { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('bbq_current_user');
    localStorage.removeItem('bbq_group_id');
    localStorage.removeItem('bbq_current_group');
    setUser(null);
    setGroup(null);
    setShowDashboard(false);
    setShowLogin(true);
  };

  // Show login dialog if no user
  if (!user && !loading) {
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

  // Show loading only during initial load (before we know if user exists)
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
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

  // Show dashboard if user exists but no group is selected
  if (user && (showDashboard || !group)) {
    return (
      <GroupsDashboard
        userId={user.id}
        userPhone={user.phone}
        userName={user.name}
        userProfileImage={user.profile_image}
        onSelectGroup={handleSelectGroup}
        onLogout={handleLogout}
      />
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

  // Main group view - only render if group is selected
  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
      {group && <InstallPrompt />}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between w-full" style={{ flexDirection: 'row-reverse' }}>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToDashboard}
              className="ml-2"
            >
              חזרה לדשבורד
            </Button>
            {/* Hide user info on mobile, show only on desktop */}
            <div className="hidden md:flex items-center gap-3">
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
          </div>
          <div className="flex items-center gap-3">
            {group.group_image ? (
              <img 
                src={group.group_image} 
                alt={group.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                {group.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{group.name}</h1>
              {group.description && (
                <p className="text-sm md:text-base text-gray-600">{group.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Update URL with tab
          if (group) {
            const newParams = new URLSearchParams();
            newParams.set('group', group.id);
            newParams.set('tab', value);
            setSearchParams(newParams, { replace: true });
          }
        }} className="w-full">
          {/* Desktop Tabs - Modern Design */}
          <div className="hidden md:block mb-8" dir="rtl">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className={`grid w-full ${user.isAdmin ? 'grid-cols-7' : 'grid-cols-6'} gap-2`} dir="rtl">
                <button
                  onClick={() => {
                    setActiveTab("events");
                    if (group) {
                      const newParams = new URLSearchParams();
                      newParams.set('group', group.id);
                      newParams.set('tab', 'events');
                      setSearchParams(newParams, { replace: true });
                    }
                  }}
                  className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === "events"
                      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30 scale-105"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                  }`}
                >
                  <Calendar className={`w-5 h-5 transition-transform ${activeTab === "events" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>אירועים</span>
                  {activeTab === "events" && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/20 to-red-500/20 blur-sm -z-10"></div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab("members");
                    if (group) {
                      const newParams = new URLSearchParams();
                      newParams.set('group', group.id);
                      newParams.set('tab', 'members');
                      setSearchParams(newParams, { replace: true });
                    }
                  }}
                  className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === "members"
                      ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg shadow-green-500/30 scale-105"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                  }`}
                >
                  <Users className={`w-5 h-5 transition-transform ${activeTab === "members" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>חברים</span>
                  {activeTab === "members" && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 to-teal-500/20 blur-sm -z-10"></div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab("payments");
                    if (group) {
                      const newParams = new URLSearchParams();
                      newParams.set('group', group.id);
                      newParams.set('tab', 'payments');
                      setSearchParams(newParams, { replace: true });
                    }
                  }}
                  className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === "payments"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                  }`}
                >
                  <DollarSign className={`w-5 h-5 transition-transform ${activeTab === "payments" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>תשלומים</span>
                  {activeTab === "payments" && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-sm -z-10"></div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab("polls");
                    if (group) {
                      const newParams = new URLSearchParams();
                      newParams.set('group', group.id);
                      newParams.set('tab', 'polls');
                      setSearchParams(newParams, { replace: true });
                    }
                  }}
                  className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === "polls"
                      ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30 scale-105"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 transition-transform ${activeTab === "polls" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>סקרים</span>
                  {activeTab === "polls" && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-400/20 to-rose-500/20 blur-sm -z-10"></div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab("reports");
                    if (group) {
                      const newParams = new URLSearchParams();
                      newParams.set('group', group.id);
                      newParams.set('tab', 'reports');
                      setSearchParams(newParams, { replace: true });
                    }
                  }}
                  className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === "reports"
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                  }`}
                >
                  <BarChart3 className={`w-5 h-5 transition-transform ${activeTab === "reports" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>דוחות</span>
                  {activeTab === "reports" && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-sm -z-10"></div>
                  )}
                </button>
                
                {user.isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab("users");
                      if (group) {
                        const newParams = new URLSearchParams();
                        newParams.set('group', group.id);
                        newParams.set('tab', 'users');
                        setSearchParams(newParams, { replace: true });
                      }
                    }}
                    className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                      activeTab === "users"
                        ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                    }`}
                  >
                    <UserIcon className={`w-5 h-5 transition-transform ${activeTab === "users" ? "scale-110" : "group-hover:scale-110"}`} />
                    <span>משתמשים</span>
                    {activeTab === "users" && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400/20 to-blue-500/20 blur-sm -z-10"></div>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    if (group) {
                      const newParams = new URLSearchParams();
                      newParams.set('group', group.id);
                      newParams.set('tab', 'settings');
                      setSearchParams(newParams, { replace: true });
                    }
                  }}
                  className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === "settings"
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/30 scale-105"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                  }`}
                >
                  <Settings className={`w-5 h-5 transition-transform ${activeTab === "settings" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>הגדרות</span>
                  {activeTab === "settings" && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-500/20 to-gray-600/20 blur-sm -z-10"></div>
                  )}
                </button>
              </div>
              {activeTab === "reports" && (
                <div
                  className="flex justify-end border-t border-gray-200/60 dark:border-gray-600/60 pt-3 mt-2 px-1 pb-1"
                  dir="rtl"
                >
                  {/* כפתור ייצוא PDF מוצג כאן בדסקטופ דרך createPortal מתוך Reports */}
                  <div id="bbq-report-pdf-slot" className="min-h-9 inline-flex items-center justify-end empty:min-h-9" />
                </div>
              )}
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNavigation 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (group) {
                const newParams = new URLSearchParams();
                newParams.set('group', group.id);
                newParams.set('tab', tab);
                setSearchParams(newParams, { replace: true });
              }
            }}
            isAdmin={user.isAdmin}
            hasUsersTab={true}
          />

          <TabsContent value="events" className="w-full text-right !block space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">אירועים</h2>
              {user.isAdmin && (
                <CreateEventDialog groupId={group.id} onEventCreated={() => { loadGroup(user.id); setEventsRefreshTrigger((t) => t + 1); }}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    אירוע חדש
                  </Button>
                </CreateEventDialog>
              )}
            </div>
            <div className="w-full text-right" dir="rtl" style={{ direction: "rtl" }}>
              <EventsList 
                groupId={group.id} 
                userId={user.id}
                isAdmin={user.isAdmin}
                externalRefreshTrigger={eventsRefreshTrigger}
                onPaymentsCalculated={() => {
                  setActiveTab("payments");
                  if (group) {
                    const newParams = new URLSearchParams();
                    newParams.set('group', group.id);
                    newParams.set('tab', 'payments');
                    setSearchParams(newParams, { replace: true });
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 pb-20 md:pb-4">
            <MembersList 
              groupId={group.id} 
              isAdmin={user.isAdmin}
              userId={user.id}
              userPhone={user.phone}
              onLeaveGroup={handleBackToDashboard}
              refreshTrigger={membersRefreshTrigger}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 pb-20 md:pb-4">
            <PaymentsOverview groupId={group.id} userId={user.id} isAdmin={user.isAdmin} />
          </TabsContent>

          <TabsContent value="polls" className="space-y-4 pb-20 md:pb-4">
            <PollsList 
              groupId={group.id} 
              userId={user.id} 
              userPhone={user.phone}
              isAdmin={user.isAdmin} 
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 pb-20 md:pb-4">
            <Reports
              groupId={group.id}
              groupName={group.name}
              pdfToolbarSlotActive={activeTab === "reports"}
            />
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
                    setUser({
                      ...updatedUser,
                      isAdmin: user.isAdmin // Preserve admin status
                    });
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
