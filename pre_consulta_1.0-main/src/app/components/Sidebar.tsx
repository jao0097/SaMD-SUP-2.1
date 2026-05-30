import { NavLink } from "react-router";
import { LayoutDashboard, Users, Calendar, TrendingDown, Activity, FileDown, Settings, Plug, Shield } from "lucide-react";

const menuSections = [
  {
    title: "Visão geral",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { path: "/funcionarios", label: "Funcionários", icon: Users },
      { path: "/consultas", label: "Consultas", icon: Calendar },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { path: "/absenteismo", label: "Absenteísmo", icon: TrendingDown },
      { path: "/sintomas", label: "Sintomas", icon: Activity },
      { path: "/exportar", label: "Exportar", icon: FileDown },
    ],
  },
  {
    title: "Admin",
    items: [
      { path: "/configuracoes", label: "Configurações", icon: Settings },
      { path: "/integracoes", label: "Integrações", icon: Plug },
      { path: "/auditoria", label: "Auditoria", icon: Shield },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="w-[180px] bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="font-semibold text-[#1D9E75]">Saúde RH</h1>
      </div>

      <nav className="flex-1 py-4">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-4 mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{section.title}</span>
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-white border-l-2 border-[#1D9E75] text-[#1D9E75]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
