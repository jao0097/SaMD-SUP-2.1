import { useState } from "react";
import { Calendar, Check, X as XIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const consultasData = [
  {
    id: "C-1842",
    func: "Func. #4821",
    setor: "TI",
    medico: "Dr. Silva",
    especialidade: "Clínico Geral",
    dataHora: new Date(2026, 4, 26, 14, 30),
    status: "confirmada",
    sintomas: ["Dor de cabeça persistente", "Fadiga"],
    recomendacoes: "Hidratação, repouso, acompanhamento em 7 dias",
    historico: [
      { data: "18/05/2026", tipo: "Consulta - Gripe", medico: "Dr. Silva" },
      { data: "10/04/2026", tipo: "Exame de rotina", medico: "Dra. Costa" },
    ],
  },
  {
    id: "C-1843",
    func: "Func. #3291",
    setor: "Financeiro",
    medico: "Dra. Costa",
    especialidade: "Cardiologia",
    dataHora: new Date(2026, 4, 26, 16, 0),
    status: "pendente",
    sintomas: ["Palpitações", "Falta de ar leve"],
    recomendacoes: "Exames cardiológicos, ECG",
    historico: [
      { data: "05/05/2026", tipo: "Consulta - Check-up", medico: "Dra. Costa" },
    ],
  },
  {
    id: "C-1844",
    func: "Func. #5012",
    setor: "Vendas",
    medico: "Dr. Mendes",
    especialidade: "Ortopedia",
    dataHora: new Date(2026, 4, 27, 9, 0),
    status: "confirmada",
    sintomas: ["Dor lombar", "Rigidez muscular"],
    recomendacoes: "Fisioterapia, ergonomia no trabalho",
    historico: [],
  },
  {
    id: "C-1845",
    func: "Func. #2873",
    setor: "Marketing",
    medico: "Dra. Oliveira",
    especialidade: "Psiquiatria",
    dataHora: new Date(2026, 4, 27, 11, 30),
    status: "pendente",
    sintomas: ["Ansiedade", "Insônia"],
    recomendacoes: "Terapia cognitivo-comportamental",
    historico: [
      { data: "12/05/2026", tipo: "Primeira consulta", medico: "Dra. Oliveira" },
    ],
  },
  {
    id: "C-1846",
    func: "Func. #4102",
    setor: "RH",
    medico: "Dr. Silva",
    especialidade: "Clínico Geral",
    dataHora: new Date(2026, 4, 28, 10, 0),
    status: "cancelada",
    sintomas: ["Resfriado comum"],
    recomendacoes: "N/A - Consulta cancelada",
    historico: [],
  },
];

export function Consultas() {
  const [statusFilter, setStatusFilter] = useState("todas");
  const [selectedConsulta, setSelectedConsulta] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const filteredConsultas = consultasData.filter(
    (c) => statusFilter === "todas" || c.status === statusFilter
  );

  const consulta = consultasData.find((c) => c.id === selectedConsulta);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Consultas</h1>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded text-sm"
          >
            <option value="todas">Todos os status</option>
            <option value="confirmada">Confirmadas</option>
            <option value="pendente">Pendentes</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                  ID
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                  Funcionário
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                  Setor
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                  Médico
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                  Especialidade
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                  Data/Hora
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsultas.map((consulta) => (
                <tr
                  key={consulta.id}
                  onClick={() => setSelectedConsulta(consulta.id)}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConsulta === consulta.id ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="py-3 px-4">{consulta.id}</td>
                  <td className="py-3 px-4">{consulta.func}</td>
                  <td className="py-3 px-4">{consulta.setor}</td>
                  <td className="py-3 px-4">{consulta.medico}</td>
                  <td className="py-3 px-4">{consulta.especialidade}</td>
                  <td className="py-3 px-4">
                    {format(consulta.dataHora, "dd/MM HH:mm", { locale: ptBR })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        consulta.status === "confirmada"
                          ? "bg-green-100 text-green-700"
                          : consulta.status === "pendente"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {consulta.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {consulta.status === "pendente" && (
                        <button
                          title="Confirmar"
                          className="p-1 hover:bg-green-100 rounded transition-colors"
                        >
                          <Check size={16} className="text-green-600" />
                        </button>
                      )}
                      <button
                        title="Remarcar"
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Calendar size={16} className="text-blue-600" />
                      </button>
                      <button
                        title="Cancelar"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCancelModal(true);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <XIcon size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedConsulta && consulta && (
          <div className="w-80 bg-white rounded border border-gray-200 p-5 space-y-5">
            <div>
              <h3 className="font-semibold mb-1">Detalhes da Consulta</h3>
              <p className="text-sm text-gray-600">{consulta.id}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Sintomas relatados</h4>
              <ul className="space-y-1">
                {consulta.sintomas.map((sintoma, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-[#1D9E75] mt-1">•</span>
                    {sintoma}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Recomendações da IA</h4>
              <p className="text-sm text-gray-700">{consulta.recomendacoes}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Histórico de consultas</h4>
              {consulta.historico.length > 0 ? (
                <div className="space-y-2">
                  {consulta.historico.map((item, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-gray-600">{item.data}</span>
                      </div>
                      <p className="font-medium">{item.tipo}</p>
                      <p className="text-gray-600">{item.medico}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhum histórico anterior</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="font-semibold text-lg mb-2">Cancelar consulta</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                Voltar
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
