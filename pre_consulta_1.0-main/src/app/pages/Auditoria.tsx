import { Download } from "lucide-react";
import { useState } from "react";

const auditLogs = [
  {
    id: 1,
    dataHora: "25/05/2026 14:32",
    usuario: "Ana Silva",
    acao: "Exportação",
    recurso: "Relatório Mensal Abril/2026",
    ip: "192.168.1.45",
    resultado: "Sucesso",
  },
  {
    id: 2,
    dataHora: "25/05/2026 10:15",
    usuario: "Carlos Mendes",
    acao: "Login",
    recurso: "Sistema",
    ip: "192.168.1.72",
    resultado: "Sucesso",
  },
  {
    id: 3,
    dataHora: "25/05/2026 09:48",
    usuario: "Ana Silva",
    acao: "Alteração de configuração",
    recurso: "Limiar de absenteísmo",
    ip: "192.168.1.45",
    resultado: "Sucesso",
  },
  {
    id: 4,
    dataHora: "24/05/2026 16:22",
    usuario: "Beatriz Costa",
    acao: "Tentativa de login",
    recurso: "Sistema",
    ip: "192.168.1.89",
    resultado: "Falha",
  },
  {
    id: 5,
    dataHora: "24/05/2026 14:10",
    usuario: "Carlos Mendes",
    acao: "Convite de usuário",
    recurso: "joao@empresa.com",
    ip: "192.168.1.72",
    resultado: "Sucesso",
  },
  {
    id: 6,
    dataHora: "24/05/2026 11:05",
    usuario: "Ana Silva",
    acao: "Exportação",
    recurso: "Relatório Absenteísmo Q1",
    ip: "192.168.1.45",
    resultado: "Sucesso",
  },
  {
    id: 7,
    dataHora: "24/05/2026 09:30",
    usuario: "Carlos Mendes",
    acao: "Logout",
    recurso: "Sistema",
    ip: "192.168.1.72",
    resultado: "Sucesso",
  },
  {
    id: 8,
    dataHora: "23/05/2026 17:45",
    usuario: "Ana Silva",
    acao: "Alteração de configuração",
    recurso: "Canal de notificação: Slack",
    ip: "192.168.1.45",
    resultado: "Sucesso",
  },
  {
    id: 9,
    dataHora: "23/05/2026 15:20",
    usuario: "Beatriz Costa",
    acao: "Login",
    recurso: "Sistema",
    ip: "192.168.1.89",
    resultado: "Sucesso",
  },
  {
    id: 10,
    dataHora: "23/05/2026 10:12",
    usuario: "Ana Silva",
    acao: "Exportação",
    recurso: "Dados LGPD - Func. #4821",
    ip: "192.168.1.45",
    resultado: "Sucesso",
  },
];

export function Auditoria() {
  const [usuarioFilter, setUsuarioFilter] = useState("todos");
  const [acaoFilter, setAcaoFilter] = useState("todas");

  const filteredLogs = auditLogs.filter((log) => {
    if (usuarioFilter !== "todos" && log.usuario !== usuarioFilter) return false;
    if (acaoFilter !== "todas" && log.acao !== acaoFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Auditoria</h1>
        <button className="px-4 py-2 bg-[#1D9E75] text-white rounded hover:bg-[#178967] flex items-center gap-2 text-sm">
          <Download size={16} />
          Exportar log (CSV)
        </button>
      </div>

      <div className="bg-white p-4 rounded border border-gray-200 flex gap-3">
        <select
          value={usuarioFilter}
          onChange={(e) => setUsuarioFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded text-sm"
        >
          <option value="todos">Todos os usuários</option>
          <option value="Ana Silva">Ana Silva</option>
          <option value="Carlos Mendes">Carlos Mendes</option>
          <option value="Beatriz Costa">Beatriz Costa</option>
        </select>

        <select
          value={acaoFilter}
          onChange={(e) => setAcaoFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded text-sm"
        >
          <option value="todas">Todas as ações</option>
          <option value="Login">Login</option>
          <option value="Logout">Logout</option>
          <option value="Exportação">Exportação</option>
          <option value="Alteração de configuração">Alteração de configuração</option>
          <option value="Convite de usuário">Convite de usuário</option>
        </select>

        <input
          type="date"
          className="px-3 py-2 border border-gray-200 rounded text-sm"
          placeholder="Data início"
        />
        <input
          type="date"
          className="px-3 py-2 border border-gray-200 rounded text-sm"
          placeholder="Data fim"
        />
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Data/Hora
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Usuário
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Ação
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Recurso
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                IP
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Resultado
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-600">{log.dataHora}</td>
                <td className="py-3 px-4 font-medium">{log.usuario}</td>
                <td className="py-3 px-4">{log.acao}</td>
                <td className="py-3 px-4 text-gray-700">{log.recurso}</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">{log.ip}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      log.resultado === "Sucesso"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {log.resultado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600">
        Exibindo {filteredLogs.length} de {auditLogs.length} registros
      </div>
    </div>
  );
}
