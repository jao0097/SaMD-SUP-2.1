import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

const usuarios = [
  { id: 1, nome: "Ana Silva", email: "ana@empresa.com", nivel: "Admin" },
  { id: 2, nome: "Carlos Mendes", email: "carlos@empresa.com", nivel: "Editor" },
  { id: 3, nome: "Beatriz Costa", email: "beatriz@empresa.com", nivel: "Visualizador" },
];

const medicos = [
  { id: 1, nome: "Dr. Silva", especialidade: "Clínico Geral", disponibilidade: "Seg-Sex 9h-17h" },
  { id: 2, nome: "Dra. Costa", especialidade: "Cardiologia", disponibilidade: "Ter-Qui 14h-18h" },
  { id: 3, nome: "Dr. Mendes", especialidade: "Ortopedia", disponibilidade: "Seg-Sex 10h-16h" },
];

export function Configuracoes() {
  const [activeTab, setActiveTab] = useState("geral");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <div className="bg-white rounded border border-gray-200">
        <div className="border-b border-gray-200 flex">
          {[
            { id: "geral", label: "Geral" },
            { id: "alertas", label: "Alertas" },
            { id: "usuarios", label: "Usuários" },
            { id: "medicos", label: "Médicos Parceiros" },
            { id: "privacidade", label: "Privacidade" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#1D9E75] text-[#1D9E75]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "geral" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Nome da empresa</label>
                <input
                  type="text"
                  defaultValue="Empresa XYZ"
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-[#1D9E75] rounded flex items-center justify-center text-white font-bold text-xl">
                    S
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                    Alterar logo
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fuso horário</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded">
                  <option>América/São Paulo (GMT-3)</option>
                  <option>América/Manaus (GMT-4)</option>
                  <option>América/Rio_Branco (GMT-5)</option>
                </select>
              </div>
              <button className="px-4 py-2 bg-[#1D9E75] text-white rounded hover:bg-[#178967] flex items-center gap-2">
                <Save size={16} />
                Salvar alterações
              </button>
            </div>
          )}

          {activeTab === "alertas" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Limiar de absenteísmo (%)
                </label>
                <input
                  type="number"
                  defaultValue="8.0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Alerta será disparado quando a taxa ultrapassar este valor
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pico de sintomas (casos/dia)
                </label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Alerta de surto quando um sintoma atingir este número em um dia
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Canais de notificação</label>
                <div className="space-y-2">
                  {["E-mail", "Slack", "Microsoft Teams"].map((canal) => (
                    <label key={canal} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={canal === "E-mail"} />
                      <span className="text-sm">{canal}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button className="px-4 py-2 bg-[#1D9E75] text-white rounded hover:bg-[#178967] flex items-center gap-2">
                <Save size={16} />
                Salvar alterações
              </button>
            </div>
          )}

          {activeTab === "usuarios" && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-[#1D9E75] text-white rounded hover:bg-[#178967] flex items-center gap-2 text-sm">
                  <Plus size={16} />
                  Convidar usuário
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">E-mail</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nível</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{usuario.nome}</td>
                      <td className="py-3 px-4">{usuario.email}</td>
                      <td className="py-3 px-4">
                        <select
                          defaultValue={usuario.nivel}
                          className="px-2 py-1 border border-gray-200 rounded text-sm"
                        >
                          <option>Admin</option>
                          <option>Editor</option>
                          <option>Visualizador</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          title="Remover usuário"
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "medicos" && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-[#1D9E75] text-white rounded hover:bg-[#178967] flex items-center gap-2 text-sm">
                  <Plus size={16} />
                  Cadastrar médico
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Especialidade
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Disponibilidade
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {medicos.map((medico) => (
                    <tr key={medico.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{medico.nome}</td>
                      <td className="py-3 px-4">{medico.especialidade}</td>
                      <td className="py-3 px-4">{medico.disponibilidade}</td>
                      <td className="py-3 px-4">
                        <button
                          title="Remover médico"
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "privacidade" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Retenção de dados</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded">
                  <option>12 meses</option>
                  <option>24 meses</option>
                  <option>36 meses</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  Dados serão excluídos automaticamente após este período
                </p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-medium text-yellow-900 mb-2">Direitos LGPD</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Os funcionários podem solicitar exportação ou exclusão dos seus dados de saúde a
                  qualquer momento.
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-white border border-yellow-300 rounded text-sm hover:bg-yellow-50">
                    Exportar dados de um funcionário
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-yellow-300 rounded text-sm hover:bg-yellow-50">
                    Excluir dados de um funcionário
                  </button>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#1D9E75] text-white rounded hover:bg-[#178967] flex items-center gap-2">
                <Save size={16} />
                Salvar alterações
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
