import { useState } from "react";
import { TrendingUp, X } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const setoresData = [
  {
    id: 1,
    nome: "TI",
    funcionarios: 48,
    graficoSemanal: [12, 15, 18, 14, 16, 11, 8],
    saude: "critical",
    adesao: 87,
    sintomaFrequente: "Dor de cabeça",
  },
  {
    id: 2,
    nome: "Financeiro",
    funcionarios: 32,
    graficoSemanal: [8, 9, 7, 10, 11, 5, 3],
    saude: "warning",
    adesao: 92,
    sintomaFrequente: "Fadiga",
  },
  {
    id: 3,
    nome: "Vendas",
    funcionarios: 64,
    graficoSemanal: [18, 20, 22, 19, 21, 12, 7],
    saude: "healthy",
    adesao: 78,
    sintomaFrequente: "Estresse",
  },
  {
    id: 4,
    nome: "Marketing",
    funcionarios: 28,
    graficoSemanal: [6, 8, 7, 9, 8, 4, 2],
    saude: "healthy",
    adesao: 85,
    sintomaFrequente: "Ansiedade",
  },
  {
    id: 5,
    nome: "RH",
    funcionarios: 16,
    graficoSemanal: [3, 4, 5, 4, 3, 2, 1],
    saude: "healthy",
    adesao: 94,
    sintomaFrequente: "Dor nas costas",
  },
  {
    id: 6,
    nome: "Logística",
    funcionarios: 52,
    graficoSemanal: [14, 16, 15, 17, 18, 8, 5],
    saude: "warning",
    adesao: 45,
    sintomaFrequente: "Dor muscular",
  },
];

const modalData30Dias = Array.from({ length: 30 }, (_, i) => ({
  dia: i + 1,
  triagens: Math.floor(Math.random() * 10) + 8,
}));

const sintomasDistribuicao = [
  { name: "Dor de cabeça", value: 35 },
  { name: "Tosse", value: 25 },
  { name: "Febre", value: 20 },
  { name: "Fadiga", value: 15 },
  { name: "Outros", value: 5 },
];

const COLORS = ["#1D9E75", "#534AB7", "#F59E0B", "#EF4444", "#9CA3AF"];

const alertasHistorico = [
  { data: "20/05", tipo: "Surto de gripe", severidade: "critical" },
  { data: "15/05", tipo: "Absenteísmo alto", severidade: "warning" },
  { data: "08/05", tipo: "Baixa adesão", severidade: "info" },
];

export function Funcionarios() {
  const [selectedSetor, setSelectedSetor] = useState<number | null>(null);

  const setor = setoresData.find((s) => s.id === selectedSetor);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Funcionários por Setor</h1>

      <div className="grid grid-cols-3 gap-4">
        {setoresData.map((setor) => (
          <div
            key={setor.id}
            onClick={() => setSelectedSetor(setor.id)}
            className="bg-white p-5 rounded border border-gray-200 cursor-pointer hover:border-[#1D9E75] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{setor.nome}</h3>
                <p className="text-sm text-gray-600">{setor.funcionarios} funcionários</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  setor.saude === "healthy"
                    ? "bg-green-100 text-green-700"
                    : setor.saude === "warning"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {setor.saude === "healthy"
                  ? "Saudável"
                  : setor.saude === "warning"
                  ? "Atenção"
                  : "Crítico"}
              </span>
            </div>

            <div className="h-12 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setor.graficoSemanal.map((v, i) => ({ value: v }))}>
                  <Bar dataKey="value" fill="#1D9E75" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Adesão à triagem</span>
                <span className="font-medium">{setor.adesao}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sintoma frequente</span>
                <span className="font-medium">{setor.sintomaFrequente}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedSetor && setor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold">{setor.nome}</h2>
                <p className="text-sm text-gray-600">{setor.funcionarios} funcionários</p>
              </div>
              <button
                onClick={() => setSelectedSetor(null)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Triagens dos últimos 30 dias</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={modalData30Dias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="triagens" stroke="#1D9E75" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Distribuição de sintomas</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sintomasDistribuicao}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sintomasDistribuicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Histórico de alertas</h3>
                <div className="space-y-2">
                  {alertasHistorico.map((alerta, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{alerta.data}</span>
                        <span className="text-sm font-medium">{alerta.tipo}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          alerta.severidade === "critical"
                            ? "bg-red-100 text-red-700"
                            : alerta.severidade === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {alerta.severidade === "critical"
                          ? "Crítico"
                          : alerta.severidade === "warning"
                          ? "Atenção"
                          : "Info"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
