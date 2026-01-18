import { Calendar, Users, DollarSign, BarChart3, Settings, User as UserIcon } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  hasUsersTab?: boolean;
}

const BottomNavigation = ({ activeTab, onTabChange, isAdmin, hasUsersTab = false }: BottomNavigationProps) => {
  const allTabs = [
    { id: "events", label: "אירועים", icon: Calendar },
    { id: "members", label: "חברים", icon: Users },
    { id: "payments", label: "תשלומים", icon: DollarSign },
    { id: "reports", label: "דוחות", icon: BarChart3 },
    ...(hasUsersTab && isAdmin ? [{ id: "users", label: "משתמשים", icon: UserIcon }] : []),
    { id: "settings", label: "הגדרות", icon: Settings },
  ];

  const gridCols = allTabs.length === 6 ? "grid-cols-6" : allTabs.length === 5 ? "grid-cols-5" : "grid-cols-4";

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden" dir="rtl">
        <div className={`grid ${gridCols} h-16`}>
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors text-right ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[10px] sm:text-xs font-medium leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;
