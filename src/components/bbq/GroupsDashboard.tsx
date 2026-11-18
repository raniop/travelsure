import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, LogOut, Bell, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  owner_id?: string;
  group_image?: string | null;
}

interface GroupInvitation {
  id: string;
  group_id: string;
  user_phone: string;
  user_id: string;
  user_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  group?: Group;
}

interface GroupsDashboardProps {
  userId: string;
  userPhone: string;
  userName: string;
  userProfileImage?: string;
  onSelectGroup: (group: Group) => void;
  onLogout: () => void;
}

const GroupsDashboard = ({ userId, userPhone, userName, userProfileImage, onSelectGroup, onLogout }: GroupsDashboardProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
    loadInvitations();
  }, [userPhone]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const allGroups = await apiClient.getGroups();
      
      // Filter groups where user is a member
      const userGroups: Group[] = [];
      for (const group of allGroups) {
        try {
          const members = await apiClient.getMembers(group.id);
          const isMember = members.some((m: any) => m.phone === userPhone);
          if (isMember) {
            userGroups.push(group);
          }
        } catch (error) {
          console.error(`Error loading members for group ${group.id}:`, error);
        }
      }
      
      setGroups(userGroups);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הקבוצות.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const fetchedInvitations = await apiClient.getGroupInvitations(userPhone);
      const pendingInvitations = fetchedInvitations.filter((inv: any) => inv.status === 'pending');

      // Enrich invitations with group details
      const enrichedInvitations = await Promise.all(
        pendingInvitations.map(async (inv: any) => {
          try {
            const group = await apiClient.getGroup(inv.group_id);
            return { ...inv, group };
          } catch (error) {
            console.error(`Error loading group for invitation ${inv.id}:`, error);
            return inv; // Return invitation without group if error
          }
        })
      );
      setInvitations(enrichedInvitations);
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleAcceptInvitation = async (invitation: GroupInvitation) => {
    try {
      await apiClient.updateGroupInvitation(invitation.id, { ...invitation, status: 'accepted' });
      await apiClient.createMember({
        group_id: invitation.group_id,
        name: invitation.user_name,
        phone: invitation.user_phone,
        email: null,
        is_active: true,
        nickname: null
      });
      toast({
        title: "הצלחה!",
        description: `הצטרפת לקבוצה ${invitation.group?.name || ''}`
      });
      await loadGroups();
      await loadInvitations();
      if (invitation.group) {
        onSelectGroup(invitation.group);
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לקבל את ההזמנה.",
        variant: "destructive"
      });
    }
  };

  const handleRejectInvitation = async (invitation: GroupInvitation) => {
    try {
      await apiClient.updateGroupInvitation(invitation.id, { ...invitation, status: 'rejected' });
      toast({
        title: "הזמנה נדחתה",
        description: `דחית את ההזמנה מ-${invitation.group?.name || ''}`
      });
      await loadInvitations();
    } catch (error: any) {
      console.error("Error rejecting invitation:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לדחות את ההזמנה.",
        variant: "destructive"
      });
    }
  };

  const handleCreateGroup = async () => {
    try {
      const newGroup = await apiClient.createGroup({
        name: "קבוצה חדשה",
        description: "",
        owner_id: userId
      });
      toast({
        title: "הצלחה!",
        description: "נוצרה קבוצה חדשה."
      });
      await loadGroups();
      onSelectGroup(newGroup);
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו ליצור קבוצה חדשה.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען קבוצות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8 text-right" dir="rtl" style={{ direction: "rtl" }}>
      {/* Header */}
      <header className="bbq-glass-bar sticky top-0 z-30 mb-6 px-4 pb-4 pt-5 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {userProfileImage ? (
              <img src={userProfileImage} alt={userName} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/15" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">הקבוצות שלי</p>
              <h1 className="truncate text-2xl font-extrabold md:text-3xl">שלום, {userName}</h1>
            </div>
          </div>
          <Button size="sm" onClick={onLogout} variant="secondary" className="shrink-0 rounded-full">
            <LogOut className="ml-1.5 h-4 w-4" />
            התנתק
          </Button>
        </div>
      </header>
      <div className="mx-auto mb-8 max-w-7xl px-4 md:px-8">
        <Button onClick={handleCreateGroup} className="h-12 w-full text-base md:w-auto">
          <Plus className="ml-2 h-4 w-4" />
          צור קבוצה חדשה
        </Button>
      </div>
      <div className="px-4 md:px-8">

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-right">הזמנות ממתינות</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="border-2 border-primary/30 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-bold">הזמנה חדשה</CardTitle>
                  </div>
                  {invitation.group && (
                    <CardDescription className="text-right">
                      הוזמנת להצטרף לקבוצה: <strong>{invitation.group.name}</strong>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="text-sm text-muted-foreground text-right">
                      נשלח ב-{format(new Date(invitation.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAcceptInvitation(invitation)} className="flex-1 gap-2" size="sm">
                        <Check className="w-4 h-4" /> אישור
                      </Button>
                      <Button onClick={() => handleRejectInvitation(invitation)} variant="outline" className="flex-1 gap-2" size="sm">
                        <X className="w-4 h-4" /> דחייה
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-right">הקבוצות שלי</h2>
        {groups.length === 0 ? (
          <Card className="p-8 text-center">
            <CardDescription className="text-lg">
              אין לך קבוצות עדיין. צור קבוצה חדשה כדי להתחיל!
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const isOwner = group.owner_id === userId;
              return (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                  onClick={() => onSelectGroup(group)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      {group.group_image ? (
                        <img src={group.group_image} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <CardTitle className="text-xl">{group.name}</CardTitle>
                    </div>
                    {isOwner && (
                      <div className="inline-block px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
                        בעלים
                      </div>
                    )}
                    {group.description && (
                      <CardDescription className="text-right mt-2">{group.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>חברים</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>אירועים</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default GroupsDashboard;
