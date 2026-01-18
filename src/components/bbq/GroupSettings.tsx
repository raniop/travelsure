import { useState } from "react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Group {
  id: string;
  name: string;
  description: string | null;
  group_image?: string | null;
}

interface GroupSettingsProps {
  group: Group;
  onGroupUpdated: () => void;
}

const GroupSettings = ({ group, onGroupUpdated }: GroupSettingsProps) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [groupImage, setGroupImage] = useState<string | null>(group.group_image || null);
  const [imagePreview, setImagePreview] = useState<string | null>(group.group_image || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
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

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "קובץ גדול מדי",
        description: "גודל הקובץ חייב להיות קטן מ-5MB",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "סוג קובץ לא תקין",
        description: "אנא בחר קובץ תמונה",
        variant: "destructive"
      });
      return;
    }

    try {
      setImageLoading(true);
      const compressedImage = await compressImage(file);
      setGroupImage(compressedImage);
      setImagePreview(compressedImage);
      toast({
        title: "תמונה נטענה",
        description: "לחץ על 'שמור שינויים' כדי לשמור את התמונה"
      });
    } catch (error) {
      console.error("Error compressing image:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את התמונה",
        variant: "destructive"
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setGroupImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await apiClient.updateGroup(group.id, {
        ...group,
        name: name.trim(),
        description: description.trim() || null,
        group_image: groupImage || null
      });

      toast({
        title: "הצלחה!",
        description: "ההגדרות עודכנו בהצלחה"
      });

      onGroupUpdated();
    } catch (error: any) {
      console.error("Error updating group:", error);
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
        <CardTitle>הגדרות קבוצה</CardTitle>
        <CardDescription>ערוך את פרטי הקבוצה</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">שם הקבוצה</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם הקבוצה"
              required
              className="text-right"
              dir="rtl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור הקבוצה..."
              rows={3}
              className="text-right"
              dir="rtl"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="groupImage">תמונת קבוצה</Label>
            <div className="flex items-center gap-4 justify-end">
              {imagePreview ? (
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={imagePreview} alt={group.name} />
                    <AvatarFallback className="text-lg">
                      {group.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-lg">
                    {group.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <Input
                  id="groupImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={imageLoading}
                  className="text-right"
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {imageLoading ? "דוחס תמונה..." : "בחר תמונה להעלאה (JPEG, PNG)"}
                </p>
              </div>
            </div>
          </div>
          
          <Button type="submit" disabled={loading || imageLoading}>
            <Save className="w-4 h-4 ml-2" />
            {loading ? "שומר..." : "שמור שינויים"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GroupSettings;
