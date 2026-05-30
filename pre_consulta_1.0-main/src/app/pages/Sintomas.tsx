import { TrendingUp } from "lucide-react";

const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const sintomas = [
  "Dor de cabeça",
  "Fadiga",
  "Tosse",
  "Febre",
  "Dor muscular",
  "Náusea",
  "Ansiedade",
  "Insônia",
];

const heatmapData = [
  [8, 12, 15, 18, 14, 5, 3],
  [10, 14, 16, 20, 18, 7, 4],
  [6, 9, 11, 14, 12, 4, 2],
  [4, 6, 8, 10, 9, 3, 1],
  [7, 10, 12, 15, 13, 5, 3],
  [3, 5, 6, 8, 7, 2, 1],
  [5, 8, 10, 12, 11, 4, 2],
  [4, 6, 7, 9, 8, 3, 2],
];

const getHeatColor = (value: number) => {
  if (value <= 3) return "bg-green-100";
  if (value <= 6) return "bg-green-200";
  if (value <= 10) return "bg-yellow-200";
  if (value <= 15) return "bg-orange-200";
  return "bg-red-200";
};

const topSintomas = [
  { nome: "Dor de cabeça", casos: 156, crescimento: 24 },
  { nome: "Fadiga", casos: 142, crescimento: 18 },
  { nome: "Tosse", casos: 128, crescimento: 32 },
  { nome: "Febre", casos: 89, crescimento: 8 },
  { nome: "Dor muscular", casos: 76, crescimento: 12 },
  { nome: "Náusea", casos: 54, crescimento: -5 },
  { nome: "Ansiedade", casos: 48, crescimento: 15 },
  { nome: "Insônia", casos: 42, crescimento: 6 },
  { nome: "Dor nas costas", casos: 38, crescimento: 22 },
  { nome: "Tontura", casos: 31, crescimento: -2 },
];

const surtos = [
  { data: "22/05", sintoma: "Tosse", setor: "TI", casos: 12 },
  { data: "18/05", sintoma: "Febre", setor: "Vendas", casos: 8 },
  { data: "12/05", sintoma: "Náusea", setor: "Logística", casos: 7 },
  { data: "08/05", sintoma: "Dor de cabeça", setor: "Financeiro", casos: 10 },
  { data: "01/05", sintoma: "Fadiga", setor: "Marketing", casos: 9 },
];

export function Sintomas() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sintomas</h1>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Heatmap - Frequência por dia da semana</h2>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1">
              <div className="w-32" />
              {diasSemana.map((dia) => (
                <div key={dia} className="w-20 text-center text-sm font-medium text-gray-600">
                  {dia}
                </div>
              ))}
            </div>
            {sintomas.map((sintoma, i) => (
              <div key={sintoma} className="flex gap-1 mt-1">
                <div className="w-32 text-sm text-gray-700 flex items-center">{sintoma}</div>
                {heatmapData[i].map((value, j) => (
                  <div
                    key={j}
                    className={`w-20 h-12 ${getHeatColor(
                      value
                    )} border border-gray-200 flex items-center justify-center text-sm font-medium`}
                    title={`${sintoma} - ${diasSemana[j]}: ${value} casos`}
                  >
                    {value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <span className="text-gray-600">Legenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-gray-200" />
            <span>Baixo (1-3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 border border-gray-200" />
            <span>Médio (7-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border border-gray-200" />
            <span>Alto (15+)</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Top 10 sintomas</h2>
        <div className="space-y-3">
          {topSintomas.map((sintoma, index) => (
            <div
              key={sintoma.nome}
              className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                <span className="font-medium">{sintoma.nome}</span>
                {sintoma.crescimento > 20 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium flex items-center gap-1">
                    <TrendingUp size={12} />
                    Em alta
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Casos</div>
                  <div className="font-semibold">{sintoma.casos}</div>
                </div>
                <div className="text-right w-24">
                  <div className="text-sm text-gray-600">Crescimento</div>
                  <div
                    className={`font-semibold ${
                      sintoma.crescimento > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {sintoma.crescimento > 0 ? "+" : ""}
                    {sintoma.crescimento}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Linha do tempo de surtos</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {surtos.map((surto, index) => (
              <div key={index} className="flex gap-4 relative">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {surto.casos}
                  </div>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-red-900 mb-1">{surto.sintoma}</div>
                      <div className="text-sm text-gray-700">
                        {surto.casos} casos registrados no setor {surto.setor}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{surto.data}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
