import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, CheckCircle2, Clock, Trash2, Users } from "lucide-react";
import CreatePollDialog from "./CreatePollDialog";

interface PollOption {
  id: string;
  text: string;
  order?: number;
}

interface PollVote {
  id: string;
  option_id: string;
  member_id: string;
  voted_at: string;
}

interface Poll {
  id: string;
  group_id: string;
  question: string;
  options: PollOption[];
  votes: PollVote[];
  created_by: string;
  created_at: string;
  expires_at?: string | null;
  is_active: boolean;
}

interface PollsListProps {
  groupId: string;
  userId: string;
  userPhone: string;
  isAdmin: boolean;
}

const PollsList = ({ groupId, userId, userPhone, isAdmin }: PollsListProps) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [userMember, setUserMember] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [groupId, userId, userPhone]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pollsData, membersData] = await Promise.all([
        apiClient.getPolls(groupId),
        apiClient.getMembers(groupId)
      ]);
      
      setMembers(membersData);
      const currentUserMember = membersData.find((m: any) => m.phone === userPhone);
      setUserMember(currentUserMember);
      
      // Sort polls by created_at (newest first)
      const sortedPolls = pollsData.sort((a: Poll, b: Poll) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setPolls(sortedPolls);
    } catch (error: any) {
      console.error("Error loading polls:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הסקרים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!userMember) {
      toast({
        title: "שגיאה",
        description: "לא נמצא חבר בקבוצה",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiClient.votePoll(pollId, optionId, userMember.id);
      toast({
        title: "הצלחה!",
        description: "ההצבעה נשמרה"
      });
      await loadData();
    } catch (error: any) {
      console.error("Error voting:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לשמור את ההצבעה",
        variant: "destructive"
      });
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הסקר הזה?")) {
      return;
    }

    try {
      await apiClient.deletePoll(pollId);
      toast({
        title: "הצלחה!",
        description: "הסקר נמחק"
      });
      await loadData();
    } catch (error: any) {
      console.error("Error deleting poll:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו למחוק את הסקר",
        variant: "destructive"
      });
    }
  };

  const getVoteCount = (poll: Poll, optionId: string): number => {
    return poll.votes?.filter(v => v.option_id === optionId).length || 0;
  };

  const getTotalVotes = (poll: Poll): number => {
    return poll.votes?.length || 0;
  };

  const getUserVote = (poll: Poll): string | null => {
    if (!userMember || !poll.votes) return null;
    const userVote = poll.votes.find(v => v.member_id === userMember.id);
    return userVote ? userVote.option_id : null;
  };

  const getMemberName = (memberId: string): string => {
    const member = members.find(m => m.id === memberId);
    return member?.name || "לא ידוע";
  };

  const isPollExpired = (poll: Poll): boolean => {
    if (!poll.expires_at) return false;
    return new Date(poll.expires_at) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען סקרים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <CreatePollDialog
            groupId={groupId}
            createdBy={userId}
            onPollCreated={loadData}
          >
            <Button>
              <MessageSquare className="w-4 h-4 ml-2" />
              צור סקר חדש
            </Button>
          </CreatePollDialog>
        </div>
      )}

      {polls.length === 0 ? (
        <Card className="border-2 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <MessageSquare className="w-12 h-12 text-primary opacity-50" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">עדיין אין סקרים</h3>
                <p className="text-muted-foreground">
                  {isAdmin ? "צור סקר ראשון כדי להתחיל!" : "המנהל עדיין לא יצר סקרים"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        polls.map((poll) => {
          const userVote = getUserVote(poll);
          const totalVotes = getTotalVotes(poll);
          const expired = isPollExpired(poll);
          const sortedOptions = [...poll.options].sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <Card key={poll.id} className="border-2 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{poll.question}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 ml-1" />
                        {format(new Date(poll.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                      </Badge>
                      {poll.expires_at && (
                        <Badge variant={expired ? "destructive" : "secondary"} className="text-xs">
                          {expired ? "פג תוקף" : `תפוגה: ${format(new Date(poll.expires_at), "dd/MM/yyyy HH:mm", { locale: he })}`}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 ml-1" />
                        {totalVotes} הצבעות
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePoll(poll.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedOptions.map((option) => {
                  const voteCount = getVoteCount(poll, option.id);
                  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                  const isUserVote = userVote === option.id;
                  const voters = poll.votes
                    ?.filter(v => v.option_id === option.id)
                    .map(v => getMemberName(v.member_id))
                    .join(", ") || "";

                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Button
                            variant={isUserVote ? "default" : "outline"}
                            size="sm"
                            onClick={() => !expired && !isUserVote && handleVote(poll.id, option.id)}
                            disabled={expired || isUserVote}
                            className={isUserVote ? "bg-primary" : ""}
                          >
                            {isUserVote && <CheckCircle2 className="w-4 h-4 ml-1" />}
                            {option.text}
                          </Button>
                          {isUserVote && (
                            <Badge variant="default" className="text-xs">
                              ההצבעה שלך
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground min-w-[80px] text-left">
                          {voteCount} ({percentage.toFixed(0)}%)
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      {voters && (
                        <p className="text-xs text-muted-foreground text-right">
                          {voters}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default PollsList;
