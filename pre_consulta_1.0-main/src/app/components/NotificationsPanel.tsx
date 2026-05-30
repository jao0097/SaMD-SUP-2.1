import { X, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: 1,
    type: "critical" as const,
    title: "Surto de sintomas respiratórios",
    description: "TI registrou 12 casos em 2 dias",
    time: "5 min atrás",
  },
  {
    id: 2,
    type: "warning" as const,
    title: "Absenteísmo acima da meta",
    description: "Financeiro está em 9.2% (meta: 8%)",
    time: "1 hora atrás",
  },
  {
    id: 3,
    type: "info" as const,
    title: "Novo relatório disponível",
    description: "Relatório mensal de abril exportado",
    time: "3 horas atrás",
  },
];

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold">Notificações</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {notifications.map((notification) => {
            const Icon =
              notification.type === "critical"
                ? AlertCircle
                : notification.type === "warning"
                ? AlertTriangle
                : Info;
            const iconColor =
              notification.type === "critical"
                ? "text-red-500"
                : notification.type === "warning"
                ? "text-yellow-600"
                : "text-blue-500";

            return (
              <div
                key={notification.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex gap-3">
                  <Icon size={20} className={iconColor} />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium mb-1">{notification.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{notification.description}</p>
                    <span className="text-xs text-gray-400">{notification.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button className="w-full text-sm text-[#1D9E75] hover:underline">
            Ver todas as notificações
          </button>
        </div>
      </div>
    </>
  );
}
