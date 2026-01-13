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
import { Phone, Lock } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (user: { id: string; name: string; phone: string; isAdmin: boolean }) => void;
  groupOwnerId?: string;
}

const LoginDialog = ({ open, onOpenChange, onLogin, groupOwnerId }: LoginDialogProps) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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

    setLoading(true);
    try {
      // Clean phone number
      const cleanPhone = phone.replace(/[^\d]/g, "");
      
      // Generate user ID from phone
      const userId = `user_${cleanPhone}`;
      
      // Check if user exists in localStorage
      const existingUsers = JSON.parse(localStorage.getItem('bbq_users') || '[]');
      const existingUser = existingUsers.find((u: any) => u.phone === cleanPhone);
      
      if (isRegistering) {
        // Register new user
        if (existingUser) {
          toast({
            title: "משתמש כבר קיים",
            description: "המשתמש כבר רשום. אנא התחבר במקום",
            variant: "destructive"
          });
          setIsRegistering(false);
          setLoading(false);
          return;
        }
        
        const newUser = {
          id: userId,
          name: cleanPhone, // Use phone as name for now (can be updated later)
          phone: cleanPhone,
          password: password, // Store password (not encrypted, but OK for this use case)
          created_at: new Date().toISOString()
        };
        
        existingUsers.push(newUser);
        localStorage.setItem('bbq_users', JSON.stringify(existingUsers));
        
        toast({
          title: "הצלחה!",
          description: "נרשמת בהצלחה"
        });
      } else {
        // Login
        if (!existingUser) {
          toast({
            title: "משתמש לא נמצא",
            description: "המשתמש לא רשום. אנא הירשם תחילה",
            variant: "destructive"
          });
          setIsRegistering(true);
          setLoading(false);
          return;
        }
        
        // Verify password
        if (existingUser.password !== password) {
          toast({
            title: "סיסמה שגויה",
            description: "הסיסמה שהזנת לא נכונה",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }
      
      // Check if user is admin (owner of the group)
      const isAdmin = groupOwnerId === userId;
      
      // Save current user
      const currentUser = existingUser || {
        id: userId,
        name: cleanPhone,
        phone: cleanPhone,
        password: password,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('bbq_current_user', JSON.stringify({
        id: currentUser.id,
        name: currentUser.name,
        phone: currentUser.phone
      }));
      
      onLogin({
        id: currentUser.id,
        name: currentUser.name,
        phone: currentUser.phone,
        isAdmin
      });
      
      onOpenChange(false);
      setPhone("");
      setPassword("");
      setIsRegistering(false);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
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
                  if (e.key === 'Enter' && password) {
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
