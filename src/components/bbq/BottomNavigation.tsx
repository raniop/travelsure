import { Calendar, Users, DollarSign, BarChart3, Settings, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  hasUsersTab?: boolean;
}

const BottomNavigation = ({ activeTab, onTabChange, isAdmin, hasUsersTab = false }: BottomNavigationProps) => {
  const tabs = [
    {
      id: "events",
      label: "אירועים",
      icon: Calendar,
    },
    {
      id: "members",
      label: "חברים",
      icon: Users,
    },
    {
      id: "payments",
      label: "תשלומים",
      icon: DollarSign,
    },
    {
      id: "reports",
      label: "דוחות",
      icon: BarChart3,
    },
    ...(isAdmin && hasUsersTab
      ? [
          {
            id: "users",
            label: "משתמשים",
            icon: UserIcon,
          },
        ]
      : []),
    {
      id: "settings",
      label: "הגדרות",
      icon: Settings,
    },
  ];

  const tabCount = tabs.length;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden"
      dir="rtl"
      style={{ direction: 'rtl' }}
    >
      <div
        className={cn(
          "grid w-full h-16 text-right",
          tabCount === 4 && "grid-cols-4",
          tabCount === 5 && "grid-cols-5",
          tabCount === 6 && "grid-cols-6"
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors text-right",
                "hover:bg-gray-50 active:bg-gray-100",
                isActive
                  ? "text-primary border-t-2 border-primary"
                  : "text-gray-600"
              )}
              dir="rtl"
              style={{ direction: 'rtl' }}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn("text-[10px] font-medium text-right", isActive && "text-primary font-semibold")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
