import { Bell } from "lucide-react";
import { NotificationsPanel } from "./NotificationsPanel";
import { useEffect, useState } from "react";

interface TopbarProps {
  onNotificationsClick: () => void;
  notificationsPanelOpen: boolean;
}

export function Topbar({ onNotificationsClick, notificationsPanelOpen }: TopbarProps) {
  const [isLive, setIsLive] = useState(true);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowPulse((prev) => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1D9E75] rounded flex items-center justify-center text-white font-bold">
            S
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
              isLive && showPulse ? "bg-green-500" : "bg-transparent"
            }`} />
            Ao vivo
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onNotificationsClick}
            className="relative p-2 hover:bg-gray-100 rounded transition-colors"
            title="Notificações"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-8 h-8 bg-[#534AB7] rounded-full flex items-center justify-center text-white text-sm">
            RH
          </div>
        </div>
      </header>

      <NotificationsPanel
        isOpen={notificationsPanelOpen}
        onClose={() => onNotificationsClick()}
      />
    </>
  );
}
