import { useState } from "react";
import { Download, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const historicoRelatorios = [
  {
    id: 1,
    tipo: "Mensal",
    periodo: "Abril/2026",
    formato: "PDF",
    data: new Date(2026, 4, 1, 10, 30),
    tamanho: "2.4 MB",
  },
  {
    id: 2,
    tipo: "Absenteísmo",
    periodo: "Q1 2026",
    formato: "Excel",
    data: new Date(2026, 3, 15, 14, 20),
    tamanho: "1.8 MB",
  },
  {
    id: 3,
    tipo: "Consultas",
    periodo: "Março/2026",
    formato: "CSV",
    data: new Date(2026, 3, 1, 9, 15),
    tamanho: "856 KB",
  },
  {
    id: 4,
    tipo: "Personalizado",
    periodo: "Fev-Mar/2026",
    formato: "PDF",
    data: new Date(2026, 2, 28, 16, 45),
    tamanho: "3.1 MB",
  },
  {
    id: 5,
    tipo: "Mensal",
    periodo: "Março/2026",
    formato: "PDF",
    data: new Date(2026, 2, 1, 11, 0),
    tamanho: "2.2 MB",
  },
];

export function Exportar() {
  const [tipo, setTipo] = useState("mensal");
  const [formato, setFormato] = useState("pdf");
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Exportar Relatórios</h1>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Novo Relatório</h2>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de relatório</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded"
            >
              <option value="mensal">Relatório Mensal</option>
              <option value="absenteismo">Absenteísmo</option>
              <option value="consultas">Consultas</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Data início</label>
              <input
                type="date"
                defaultValue="2026-05-01"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data fim</label>
              <input
                type="date"
                defaultValue="2026-05-25"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Setores</label>
            <div className="border border-gray-200 rounded p-3 space-y-2 max-h-40 overflow-auto">
              {["Todos", "TI", "Financeiro", "Vendas", "Marketing", "RH", "Logística"].map(
                (setor) => (
                  <label key={setor} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={setor === "Todos"}
                      className="rounded"
                    />
                    <span className="text-sm">{setor}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Formato</label>
            <div className="flex gap-3">
              {["pdf", "excel", "csv"].map((fmt) => (
                <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="formato"
                    value={fmt}
                    checked={formato === fmt}
                    onChange={(e) => setFormato(e.target.value)}
                  />
                  <span className="text-sm uppercase">{fmt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nível de detalhe</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded">
              <option>Resumido</option>
              <option>Detalhado</option>
              <option>Completo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Visualizar Preview
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1D9E75] text-white rounded hover:bg-[#178967] flex items-center gap-2"
            >
              <Download size={16} />
              Exportar Relatório
            </button>
          </div>
        </form>

        {showPreview && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-start gap-3">
              <FileText className="text-blue-600 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">Preview do Relatório</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Relatório {tipo} - Período: 01/05/2026 a 25/05/2026
                  <br />
                  Setores: Todos | Formato: {formato.toUpperCase()}
                </p>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <strong className="text-yellow-900">⚠️ Aviso LGPD:</strong>
                  <p className="text-yellow-800 mt-1">
                    Este relatório contém dados agregados e anônimos de saúde. Não compartilhe com
                    pessoas não autorizadas. O acesso e exportação estão sendo registrados no log de
                    auditoria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Histórico de Exportações</h2>
        <div className="space-y-2">
          {historicoRelatorios.map((relatorio) => (
            <div
              key={relatorio.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-gray-400" />
                <div>
                  <div className="font-medium">
                    {relatorio.tipo} - {relatorio.periodo}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(relatorio.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span>•</span>
                    <span>{relatorio.tamanho}</span>
                    <span>•</span>
                    <span className="uppercase">{relatorio.formato}</span>
                  </div>
                </div>
              </div>
              <button
                title="Baixar novamente"
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <Download size={16} className="text-[#1D9E75]" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
