import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, CheckCircle2, Clock, Trash2, Users, Check } from "lucide-react";
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
  const [votingKey, setVotingKey] = useState<string | null>(null);
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
      
      // Ensure pollsData is an array
      const pollsArray = Array.isArray(pollsData) ? pollsData : [];
      
      // Filter out polls without required fields and add defaults
      const validPolls = pollsArray.map((poll: any) => {
        // If poll doesn't have id or created_at, it's an old poll - skip it or add defaults
        if (!poll.id || !poll.created_at) {
          // Skip invalid polls for now
          return null;
        }
        // Ensure votes array exists
        if (!poll.votes) {
          poll.votes = [];
        }
        // Fix options without IDs - assign IDs to options that are missing them
        if (poll.options && Array.isArray(poll.options)) {
          poll.options = poll.options.map((option: any, index: number) => {
            if (!option.id) {
              // If it's the first option (index 0), use "1" as ID (matching CreatePollDialog)
              // Otherwise, generate a new ID
              option.id = index === 0 ? "1" : `option-${Date.now()}-${index}`;
            }
            return option;
          });
        }
        return poll;
      }).filter((p: any) => p !== null) as Poll[];
      
      // Sort polls by created_at (newest first)
      const sortedPolls = validPolls.sort((a: Poll, b: Poll) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      
      setPolls(sortedPolls);
    } catch (error: any) {
      console.error("Error loading polls:", error);
      // Set empty array on error to prevent UI issues
      setPolls([]);
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

    // Validate optionId
    if (!optionId) {
      console.log("Invalid optionId", { pollId, optionId });
      toast({
        title: "שגיאה",
        description: "אופציה לא תקינה בסקר",
        variant: "destructive"
      });
      return;
    }

    const key = `${pollId}:${optionId}`;
    if (votingKey === key) return; // Prevent double-click

    try {
      setVotingKey(key);
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
    } finally {
      setVotingKey(null);
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

  const getUserVotes = (poll: Poll): string[] => {
    if (!userMember || !poll.votes) return [];
    return poll.votes
      .filter(v => v.member_id === userMember.id)
      .map(v => v.option_id);
  };
  
  const isOptionSelected = (poll: Poll, optionId: string): boolean => {
    const userVotes = getUserVotes(poll);
    return userVotes.includes(optionId);
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
    <div className="w-full flex justify-center" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      <div className="w-full max-w-3xl space-y-4 px-4">
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
            const totalVotes = getTotalVotes(poll);
            const expired = isPollExpired(poll);
            const sortedOptions = [...poll.options].sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <Card key={poll.id} className="border-2 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 text-right">
                      <CardTitle className="text-xl mb-3 text-right">{poll.question}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
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
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sortedOptions.map((option, optionIndex) => {
                    // Ensure option has an ID - if not, assign one
                    if (!option.id) {
                      option.id = optionIndex === 0 ? "1" : `option-${Date.now()}-${optionIndex}`;
                    }
                    
                    // Log options for debugging (only first option of first poll)
                    if (poll.id === polls[0]?.id && optionIndex === 0) {
                      console.log("options", poll.id, sortedOptions.map(o => ({ id: o.id, text: o.text })));
                    }
                    
                    const voteCount = getVoteCount(poll, option.id);
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                    const isSelected = isOptionSelected(poll, option.id);
                    const voters = poll.votes
                      ?.filter(v => v.option_id === option.id)
                      .map(v => getMemberName(v.member_id))
                      .join(", ") || "";

                    return (
                      <div key={option.id || `option-${optionIndex}`} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`poll-${poll.id}-option-${option.id || optionIndex}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (expired) return;
                              if (!option.id) return;
                              // Handle both checking and unchecking
                              // If checked is true, vote; if false, unvote (toggle)
                              if (checked === true) {
                                handleVote(poll.id, option.id);
                              } else if (checked === false) {
                                // Unvote by calling handleVote again (it toggles)
                                handleVote(poll.id, option.id);
                              }
                              // Ignore "indeterminate" state
                            }}
                            disabled={expired || votingKey === `${poll.id}:${option.id}` || !option.id}
                            className="h-5 w-5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <label
                                htmlFor={`poll-${poll.id}-option-${option.id}`}
                                className={`flex-1 cursor-pointer text-right ${expired ? 'cursor-not-allowed opacity-50' : ''} ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}
                              >
                                {option.text}
                              </label>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isSelected && (
                                  <Badge variant="default" className="text-xs">
                                    <Check className="w-3 h-3 ml-1" />
                                    נבחר
                                  </Badge>
                                )}
                                <div className="text-sm text-muted-foreground whitespace-nowrap">
                                  {voteCount} ({percentage.toFixed(0)}%)
                                </div>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            {voters && (
                              <p className="text-xs text-muted-foreground text-right mt-1">
                                {voters}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PollsList;
