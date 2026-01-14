import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, User as UserIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  phone: string;
  profile_image?: string;
}

interface UserSettingsProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

const UserSettings = ({ user, onUserUpdated }: UserSettingsProps) => {
  const [name, setName] = useState(user.name);
  const [profileImage, setProfileImage] = useState<string | null>(user.profile_image || null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(user.profile_image || null);
  const { toast } = useToast();

  useEffect(() => {
    setName(user.name);
    setProfileImage(user.profile_image || null);
    setImagePreview(user.profile_image || null);
  }, [user]);

  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('לא הצלחנו ליצור canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const base64String = canvas.toDataURL('image/jpeg', quality);
          
          // Check if compressed image is still too large (>2MB)
          const base64Size = (base64String.length * 3) / 4; // Approximate size in bytes
          if (base64Size > 2 * 1024 * 1024) {
            // Try with lower quality
            const lowerQuality = quality * 0.7;
            const compressedBase64 = canvas.toDataURL('image/jpeg', lowerQuality);
            resolve(compressedBase64);
          } else {
            resolve(base64String);
          }
        };
        img.onerror = () => reject(new Error('שגיאה בטעינת התמונה'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ תמונה",
        variant: "destructive"
      });
      return;
    }

    try {
      // Show loading state for image processing
      setImageLoading(true);

      // Compress image if needed (max 800x800, quality 0.8)
      const compressedBase64 = await compressImage(file, 800, 800, 0.8);
      
      setProfileImage(compressedBase64);
      setImagePreview(compressedBase64);
      
      toast({
        title: "הצלחה!",
        description: "התמונה נדחסה והועלתה בהצלחה"
      });
    } catch (error: any) {
      console.error("Error compressing image:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעבד את התמונה",
        variant: "destructive"
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const updatedUser = {
        ...user,
        name: name.trim(),
        profile_image: profileImage || null
      };

      await apiClient.updateUser(user.id, updatedUser);

      // Update localStorage
      const savedUser = localStorage.getItem('bbq_current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        localStorage.setItem('bbq_current_user', JSON.stringify({
          ...userData,
          name: updatedUser.name,
          profile_image: updatedUser.profile_image
        }));
      }

      toast({
        title: "הצלחה!",
        description: "ההגדרות עודכנו בהצלחה"
      });

      onUserUpdated(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את ההגדרות",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>הגדרות פרופיל</CardTitle>
        <CardDescription>ערוך את פרטי הפרופיל שלך</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              {imagePreview ? (
                <AvatarImage src={imagePreview} alt={name} />
              ) : (
                <AvatarFallback className="text-2xl">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col gap-2 items-center">
              <Label htmlFor="profile-image" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" disabled={imageLoading} asChild>
                  <span>
                    <Upload className="w-4 h-4 ml-2" />
                    {imageLoading ? "מעבד תמונה..." : "העלה תמונת פרופיל"}
                  </span>
                </Button>
              </Label>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                >
                  הסר תמונה
                </Button>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">שם</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="השם שלך"
              required
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Phone (read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              value={user.phone}
              disabled
              className="bg-muted text-right"
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground">מספר הטלפון לא ניתן לשינוי</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="w-4 h-4 ml-2" />
            {loading ? "שומר..." : "שמור שינויים"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserSettings;
