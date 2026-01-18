import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, CheckCircle2, XCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profile_image?: string;
  created_at?: string;
}

interface UsersListProps {
  groupId: string;
}

const UsersList = ({ groupId }: UsersListProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [groupId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load all registered users
      const allUsers = await apiClient.getUsers();
      
      // Load members to check who is in the group
      const groupMembers = await apiClient.getMembers(groupId);
      setMembers(groupMembers);
      
      // Sort users by name
      setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name, 'he')));
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את המשתמשים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isUserInGroup = (userPhone: string) => {
    return members.some(m => m.phone === userPhone);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          טוען משתמשים...
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          עדיין אין משתמשים שנרשמו לאפליקציה.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">משתמשים שנרשמו לאפליקציה</CardTitle>
          <CardDescription className="text-right">
            סה"כ {users.length} משתמשים שנרשמו לאפליקציה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => {
              const inGroup = isUserInGroup(user.phone);
              return (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3 justify-end">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 justify-end">
                          <span className="text-right truncate">{user.name}</span>
                          {inGroup ? (
                            <Badge variant="default" className="shrink-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              בקבוצה
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0">
                              <XCircle className="w-3 h-3 mr-1" />
                              לא בקבוצה
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      <Avatar className="w-12 h-12 shrink-0">
                        {user.profile_image ? (
                          <AvatarImage src={user.profile_image} alt={user.name} />
                        ) : (
                          <AvatarFallback className="text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-right">
                      {user.phone && (
                        <div className="flex items-center gap-2 justify-end">
                          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm">{user.phone}</span>
                        </div>
                      )}
                      {user.email && (
                        <div className="flex items-center gap-2 justify-end">
                          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      )}
                      {user.created_at && (
                        <div className="text-xs text-muted-foreground mt-2">
                          נרשם: {new Date(user.created_at).toLocaleString('he-IL', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersList;
