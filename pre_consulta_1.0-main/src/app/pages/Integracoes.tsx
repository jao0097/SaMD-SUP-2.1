import { CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";

const integracoes = [
  {
    id: "slack",
    nome: "Slack",
    descricao: "Receba alertas e notificações no Slack",
    conectado: true,
  },
  {
    id: "teams",
    nome: "Microsoft Teams",
    descricao: "Integração com Microsoft Teams",
    conectado: false,
  },
  {
    id: "calendar",
    nome: "Google Calendar",
    descricao: "Sincronize consultas com Google Calendar",
    conectado: true,
  },
  {
    id: "sap",
    nome: "SAP / Totvs",
    descricao: "Integração com sistema de RH",
    conectado: false,
  },
];

const webhookLogs = [
  {
    id: 1,
    evento: "consulta.confirmada",
    status: 200,
    data: "25/05 14:32:18",
    duracao: "245ms",
  },
  {
    id: 2,
    evento: "alerta.critico",
    status: 200,
    data: "25/05 10:45:22",
    duracao: "189ms",
  },
  {
    id: 3,
    evento: "relatorio.exportado",
    status: 200,
    data: "25/05 09:15:03",
    duracao: "312ms",
  },
  {
    id: 4,
    evento: "consulta.cancelada",
    status: 500,
    data: "24/05 16:20:45",
    duracao: "2.1s",
  },
  {
    id: 5,
    evento: "absenteismo.alerta",
    status: 200,
    data: "24/05 09:10:12",
    duracao: "201ms",
  },
];

export function Integracoes() {
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText("https://api.sauderh.com/webhook/abc123xyz");
    toast.success("URL copiada para a área de transferência");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Integrações</h1>

      <div className="grid grid-cols-2 gap-4">
        {integracoes.map((integracao) => (
          <div
            key={integracao.id}
            className="bg-white p-5 rounded border border-gray-200 flex items-start justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{integracao.nome}</h3>
                {integracao.conectado ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <XCircle size={18} className="text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{integracao.descricao}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    integracao.conectado
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {integracao.conectado ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded text-sm font-medium ${
                integracao.conectado
                  ? "border border-gray-300 hover:bg-gray-50"
                  : "bg-[#1D9E75] text-white hover:bg-[#178967]"
              }`}
            >
              {integracao.conectado ? "Desconectar" : "Conectar"}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">Webhook Personalizado</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">URL do Webhook</label>
            <div className="flex gap-2">
              <input
                type="text"
                value="https://api.sauderh.com/webhook/abc123xyz"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-200 rounded bg-gray-50"
              />
              <button
                onClick={copyWebhookUrl}
                title="Copiar URL"
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Use esta URL para receber eventos em tempo real
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Eventos disponíveis</label>
            <div className="border border-gray-200 rounded p-3 space-y-2 max-h-48 overflow-auto">
              {[
                "consulta.criada",
                "consulta.confirmada",
                "consulta.cancelada",
                "alerta.critico",
                "alerta.atencao",
                "relatorio.exportado",
                "absenteismo.alerta",
                "surto.detectado",
              ].map((evento) => (
                <label key={evento} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm font-mono">{evento}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Log das últimas chamadas</h3>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Evento</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Data/Hora</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-xs">{log.evento}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.status === 200
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{log.data}</td>
                      <td className="py-2 px-3 text-gray-600">{log.duracao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
