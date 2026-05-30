import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const dados12Meses = [
  { mes: "Jun/25", taxa: 7.2, triagens: 420 },
  { mes: "Jul/25", taxa: 6.8, triagens: 445 },
  { mes: "Ago/25", taxa: 7.5, triagens: 410 },
  { mes: "Set/25", taxa: 8.1, triagens: 380 },
  { mes: "Out/25", taxa: 8.9, triagens: 355 },
  { mes: "Nov/25", taxa: 7.3, triagens: 430 },
  { mes: "Dez/25", taxa: 6.5, triagens: 460 },
  { mes: "Jan/26", taxa: 7.8, triagens: 405 },
  { mes: "Fev/26", taxa: 8.4, triagens: 390 },
  { mes: "Mar/26", taxa: 9.1, triagens: 370 },
  { mes: "Abr/26", taxa: 8.7, triagens: 385 },
  { mes: "Mai/26", taxa: 9.2, triagens: 365 },
];

const setoresAbsenteismo = [
  { setor: "TI", faltas: 42, taxa: 9.2, variacao: 1.5 },
  { setor: "Financeiro", faltas: 28, taxa: 9.0, variacao: 2.1 },
  { setor: "Vendas", faltas: 51, taxa: 8.3, variacao: -0.4 },
  { setor: "Marketing", faltas: 22, taxa: 8.1, variacao: 0.8 },
  { setor: "RH", faltas: 11, taxa: 7.1, variacao: -0.3 },
  { setor: "Logística", faltas: 38, taxa: 7.5, variacao: -1.2 },
];

const correlacaoData = [
  { triagens: 420, faltas: 7.2 },
  { triagens: 445, faltas: 6.8 },
  { triagens: 410, faltas: 7.5 },
  { triagens: 380, faltas: 8.1 },
  { triagens: 355, faltas: 8.9 },
  { triagens: 430, faltas: 7.3 },
  { triagens: 460, faltas: 6.5 },
  { triagens: 405, faltas: 7.8 },
  { triagens: 390, faltas: 8.4 },
  { triagens: 370, faltas: 9.1 },
  { triagens: 385, faltas: 8.7 },
  { triagens: 365, faltas: 9.2 },
];

export function Absenteismo() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Absenteísmo</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Taxa atual</span>
            <TrendingUp size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-semibold mb-1 text-red-600">9.2%</div>
          <div className="text-xs text-gray-600">Meta: 8.0%</div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Custo estimado (mês)</span>
            <AlertTriangle size={16} className="text-yellow-600" />
          </div>
          <div className="text-2xl font-semibold mb-1">R$ 84.300</div>
          <div className="text-xs text-red-600">+12% vs mês anterior</div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Setor mais afetado</span>
            <TrendingUp size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-semibold mb-1">TI</div>
          <div className="text-xs text-gray-600">42 faltas (9.2%)</div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-600">Tendência</span>
            <TrendingUp size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-semibold mb-1 text-red-600">Crescente</div>
          <div className="text-xs text-red-600">+1.2% nos últimos 3 meses</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Taxa de absenteísmo - Últimos 12 meses</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#1D9E75] rounded" />
              <span>Taxa de absenteísmo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-400 border-dashed rounded" />
              <span>Meta (8%)</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dados12Meses}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 12]} />
            <Tooltip />
            <ReferenceLine y={8} stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={2} />
            <Line type="monotone" dataKey="taxa" stroke="#1D9E75" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Absenteísmo por setor</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Setor
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Faltas
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Taxa %
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                Variação vs mês anterior
              </th>
            </tr>
          </thead>
          <tbody>
            {setoresAbsenteismo.map((setor) => (
              <tr key={setor.setor} className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">{setor.setor}</td>
                <td className="py-3 px-4">{setor.faltas}</td>
                <td className="py-3 px-4">
                  <span
                    className={`${
                      setor.taxa > 8 ? "text-red-600 font-medium" : "text-gray-700"
                    }`}
                  >
                    {setor.taxa.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {setor.variacao > 0 ? (
                      <TrendingUp size={16} className="text-red-500" />
                    ) : (
                      <TrendingDown size={16} className="text-green-500" />
                    )}
                    <span
                      className={`${
                        setor.variacao > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {setor.variacao > 0 ? "+" : ""}
                      {setor.variacao.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Correlação: Triagens vs Faltas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              dataKey="triagens"
              name="Triagens"
              tick={{ fontSize: 12 }}
              label={{ value: "Triagens no mês", position: "bottom", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="faltas"
              name="Taxa de faltas"
              tick={{ fontSize: 12 }}
              label={{
                value: "Taxa de absenteísmo (%)",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
              }}
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="Correlação" data={correlacaoData} fill="#534AB7" />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-3 text-center">
          Correlação negativa: quanto mais triagens, menor a taxa de absenteísmo
        </p>
      </div>
    </div>
  );
}
