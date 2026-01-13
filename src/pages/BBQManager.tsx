import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Calendar, DollarSign, History, Settings, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateEventDialog from "@/components/bbq/CreateEventDialog";
import EventsList from "@/components/bbq/EventsList";
import MembersList from "@/components/bbq/MembersList";
import PaymentsOverview from "@/components/bbq/PaymentsOverview";
import GroupSettings from "@/components/bbq/GroupSettings";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const BBQManager = () => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events");
  const { toast } = useToast();

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
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
        
        // Save the group ID for next time
        localStorage.setItem('bbq_group_id', targetGroup.id);
        setGroup(targetGroup);
      } else {
        // Create default group only if no groups exist
        const newGroup = await apiClient.createGroup({
          name: "העל האש שלנו",
          description: "חבורת העל האש השבועית"
        });
        localStorage.setItem('bbq_group_id', newGroup.id);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!group && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">שגיאה בטעינת הקבוצה</CardTitle>
            <CardDescription className="text-base mt-2">
              נראה שיש בעיה בחיבור ל-API endpoint. ודא שהקובץ api-bbq.ashx (או api-bbq.php) נמצא בשרת ופועל
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">מה צריך לעשות:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                  <strong>ודא שה-API endpoint עובד</strong> - העתק את הקובץ <code className="bg-background px-1 rounded">api-bbq.php</code> (או <code className="bg-background px-1 rounded">api-bbq.ashx</code>) לשרת שלך
                </li>
                <li>
                  <strong>הנתונים נשמרים ב-JSON files</strong> - התיקייה <code className="bg-background px-1 rounded">data/bbq</code> (או <code className="bg-background px-1 rounded">App_Data/bbq</code> עבור .ashx) תיווצר אוטומטית
                </li>
                <li>
                  <strong>רענן את הדף</strong> אחרי שהקבצים נמצאים בשרת
                </li>
              </ol>
            </div>
            <Button onClick={loadGroup} className="w-full">
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-gray-600">{group.description}</p>
          )}
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
              <CreateEventDialog groupId={group.id} onEventCreated={loadGroup}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  אירוע חדש
                </Button>
              </CreateEventDialog>
            </div>
            <EventsList 
              groupId={group.id} 
              onPaymentsCalculated={() => setActiveTab("payments")}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">חברים קבועים</h2>
            <MembersList groupId={group.id} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">סקירת תשלומים</h2>
            <PaymentsOverview groupId={group.id} />
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
            <h2 className="text-2xl font-semibold mb-4">הגדרות קבוצה</h2>
            <GroupSettings group={group} onGroupUpdated={loadGroup} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BBQManager;
