import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const triagensData = [
  { day: "Seg", count: 45 },
  { day: "Ter", count: 52 },
  { day: "Qua", count: 48 },
  { day: "Qui", count: 61 },
  { day: "Sex", count: 55 },
  { day: "Sáb", count: 12 },
  { day: "Dom", count: 8 },
];

const sintomasData = [
  { sintoma: "Dor de cabeça", percent: 32 },
  { sintoma: "Fadiga", percent: 28 },
  { sintoma: "Tosse", percent: 24 },
  { sintoma: "Febre", percent: 18 },
  { sintoma: "Dor muscular", percent: 15 },
  { sintoma: "Náusea", percent: 12 },
];

const consultasData = [
  { id: "C-1842", func: "Func. #4821", setor: "TI", data: "26/05 14:30", status: "confirmada" },
  { id: "C-1843", func: "Func. #3291", setor: "Financeiro", data: "26/05 16:00", status: "pendente" },
  { id: "C-1844", func: "Func. #5012", setor: "Vendas", data: "27/05 09:00", status: "confirmada" },
  { id: "C-1845", func: "Func. #2873", setor: "Marketing", data: "27/05 11:30", status: "pendente" },
  { id: "C-1846", func: "Func. #4102", setor: "RH", data: "28/05 10:00", status: "cancelada" },
];

const alertasData = [
  { id: 1, severity: "critical", message: "Surto de sintomas respiratórios em TI - 12 casos", time: "10:45" },
  { id: 2, severity: "warning", message: "Absenteísmo em Financeiro acima da meta (9.2%)", time: "09:20" },
  { id: 3, severity: "info", message: "Baixa adesão à triagem no setor Logística (45%)", time: "08:15" },
];

export function Dashboard() {
  const [setor, setSetor] = useState("todos");
  const [periodo, setPeriodo] = useState("7dias");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-3">
          <select
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded text-sm"
          >
            <option value="todos">Todos os setores</option>
            <option value="ti">TI</option>
            <option value="financeiro">Financeiro</option>
            <option value="vendas">Vendas</option>
            <option value="marketing">Marketing</option>
          </select>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded text-sm"
          >
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="90dias">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Triagens hoje</span>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <div className="text-2xl font-semibold mb-1">58</div>
          <div className="text-xs text-green-600">+8 vs ontem</div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Absenteísmo</span>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-semibold mb-1 text-red-600">9.2%</div>
          <div className="text-xs text-red-600">Acima da meta (8%)</div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Consultas na semana</span>
            <Calendar size={16} className="text-[#534AB7]" />
          </div>
          <div className="text-2xl font-semibold mb-1">24</div>
          <div className="text-xs text-gray-600">3 pendentes</div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Alertas ativos</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-semibold mb-1 text-red-600">3</div>
          <div className="text-xs text-red-600">1 crítico</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded border border-gray-200">
          <h2 className="font-semibold mb-4">Triagens dos últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={triagensData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1D9E75" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <h2 className="font-semibold mb-4">Top 6 sintomas</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sintomasData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="sintoma" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="percent" fill="#534AB7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded border border-gray-200">
          <h2 className="font-semibold mb-4">Consultas agendadas</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">ID</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Funcionário</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Setor</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Data</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {consultasData.map((consulta) => (
                  <tr key={consulta.id} className="border-b border-gray-100">
                    <td className="py-2 px-2">{consulta.id}</td>
                    <td className="py-2 px-2">{consulta.func}</td>
                    <td className="py-2 px-2">{consulta.setor}</td>
                    <td className="py-2 px-2">{consulta.data}</td>
                    <td className="py-2 px-2">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <h2 className="font-semibold mb-4">Alertas em tempo real</h2>
          <div className="space-y-3">
            {alertasData.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-3 rounded border ${
                  alerta.severity === "critical"
                    ? "bg-red-50 border-red-200"
                    : alerta.severity === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium uppercase ${
                          alerta.severity === "critical"
                            ? "text-red-700"
                            : alerta.severity === "warning"
                            ? "text-yellow-700"
                            : "text-blue-700"
                        }`}
                      >
                        {alerta.severity === "critical"
                          ? "Crítico"
                          : alerta.severity === "warning"
                          ? "Atenção"
                          : "Info"}
                      </span>
                      <span className="text-xs text-gray-500">{alerta.time}</span>
                    </div>
                    <p className="text-sm">{alerta.message}</p>
                  </div>
                  <button className="px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50">
                    Resolver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
