import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if already shown (localStorage)
    const installPromptShown = localStorage.getItem('install-prompt-shown');
    if (installPromptShown) {
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show instructions after a delay
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
    localStorage.setItem('install-prompt-shown', 'true');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('install-prompt-shown', 'true');
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
      <AlertDialogContent dir="rtl" className="text-right">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">הוסף למסך הבית</AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            {isIOS ? (
              <div className="space-y-3 mt-4">
                <p>להוספת האפליקציה למסך הבית ב-iOS:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>לחץ על כפתור השיתוף <span className="font-bold">(חץ למעלה)</span> בתחתית המסך</li>
                  <li>גלול למטה ובחר <span className="font-bold">"הוסף למסך הבית"</span></li>
                  <li>לחץ על <span className="font-bold">"הוסף"</span> בפינה הימנית העליונה</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                <p>הוסף את האפליקציה למסך הבית לגישה מהירה ונוחה יותר!</p>
                <p className="text-sm text-muted-foreground">
                  האפליקציה תעבוד גם ללא חיבור לאינטרנט ותראה כמו אפליקציה רגילה.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel onClick={handleDismiss} className="flex-1">
            <X className="w-4 h-4 ml-2" />
            לא עכשיו
          </AlertDialogCancel>
          {!isIOS && deferredPrompt && (
            <AlertDialogAction onClick={handleInstall} className="flex-1">
              <Download className="w-4 h-4 ml-2" />
              הוסף למסך הבית
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InstallPrompt;
