import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Lock, User } from "lucide-react";
import { apiClient, ApiError, type AuthResult } from "@/integrations/api/client";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (user: { id: string; name: string; phone: string; isAdmin: boolean; profile_image?: string }) => void;
  groupOwnerId?: string;
}

const LoginDialog = ({ open, onOpenChange, onLogin, groupOwnerId }: LoginDialogProps) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן מספר טלפון",
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן סיסמה",
        variant: "destructive"
      });
      return;
    }

    // Validate full name only when registering
    if (isRegistering && !fullName.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם מלא",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^\d]/g, "");

      // The server checks the password and returns a session token; the browser never sees passwords.
      let result: AuthResult;
      try {
        result = isRegistering
          ? await apiClient.register(fullName.trim(), cleanPhone, password)
          : await apiClient.login(cleanPhone, password);
      } catch (err) {
        const code = err instanceof ApiError ? err.code : "";
        if (code === "user_exists") {
          toast({ title: "משתמש כבר קיים", description: "המשתמש כבר רשום. אנא התחבר במקום", variant: "destructive" });
          setIsRegistering(false);
          return;
        }
        if (code === "user_not_found") {
          toast({ title: "משתמש לא נמצא", description: "המשתמש לא רשום. אנא הירשם תחילה", variant: "destructive" });
          setIsRegistering(true);
          return;
        }
        if (code === "wrong_password") {
          toast({ title: "סיסמה שגויה", description: "הסיסמה שהזנת לא נכונה", variant: "destructive" });
          return;
        }
        if (code === "too_many_attempts") {
          toast({ title: "יותר מדי ניסיונות", description: "נסו שוב בעוד כמה דקות", variant: "destructive" });
          return;
        }
        throw err;
      }

      const existingUser = result.user;
      if (isRegistering) {
        toast({ title: "הצלחה!", description: "נרשמת בהצלחה" });
      } else if (result.password_set) {
        toast({ title: "סיסמה עודכנה", description: "סיסמה נקבעה בהצלחה. מתחבר..." });
      }

      // Check if user is admin (owner of the group)
      const isAdmin = groupOwnerId === existingUser.id;

      // Save current user to localStorage (for quick access, but data is on server)
      localStorage.setItem('bbq_current_user', JSON.stringify({
        id: existingUser.id,
        name: existingUser.name,
        phone: existingUser.phone,
        profile_image: existingUser.profile_image || null
      }));

      onLogin({
        id: existingUser.id,
        name: existingUser.name,
        phone: existingUser.phone,
        isAdmin,
        profile_image: existingUser.profile_image || undefined
      });

      onOpenChange(false);
      setPhone("");
      setPassword("");
      setFullName("");
      setIsRegistering(false);
    } catch (error: any) {
      console.error("Login/Register error:", error);
      const errorMessage = error.message || error.error || "אירעה שגיאה";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isRegistering ? "הרשמה" : "התחברות"}
          </DialogTitle>
          <DialogDescription>
            {isRegistering 
              ? "הירשם כדי לראות את התשלומים שלך"
              : "התחבר כדי לראות את התשלומים שלך"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isRegistering && (
            <div className="space-y-2">
              <Label htmlFor="fullName">שם מלא</Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="הזן שם מלא"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && phone && password) {
                      handleSubmit();
                    }
                  }}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">מספר טלפון</Label>
            <div className="relative">
              <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password && (!isRegistering || fullName)) {
                    handleSubmit();
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder={isRegistering ? "בחר סיסמה" : "הזן סיסמה"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "מעבד..." : isRegistering ? "הירשם" : "התחבר"}
            </Button>
          </div>
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm"
            >
              {isRegistering 
                ? "כבר יש לך חשבון? התחבר"
                : "אין לך חשבון? הירשם"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
