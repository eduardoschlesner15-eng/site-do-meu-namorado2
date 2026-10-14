"use client";

import { useState, useEffect } from "react";
import { 
  getEvolutionConfig, 
  saveEvolutionConfig, 
  sendEvolutionMessage, 
  checkEvolutionConnection, 
  EvolutionConfig 
} from "@/lib/whatsapp";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: EvolutionConfig) => void;
  testPhoneDefault?: string;
};

export default function EvolutionConfigModal({
  isOpen,
  onClose,
  onConfigSaved,
  testPhoneDefault = "5555996206060",
}: Props) {
  const [config, setConfig] = useState<EvolutionConfig>({
    baseUrl: "",
    apiKey: "",
    instanceName: "loja",
  });

  const [testPhone, setTestPhone] = useState(testPhoneDefault);
  const [isSaved, setIsSaved] = useState(false);

  // Status de verificação de conexão
  const [connStatus, setConnStatus] = useState<{
    loading: boolean;
    checked: boolean;
    connected?: boolean;
    message?: string;
  }>({ loading: false, checked: false });

  // Status de disparo de teste
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    sent: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false, sent: false });

  useEffect(() => {
    if (isOpen) {
      const current = getEvolutionConfig();
      setConfig(current);
      if (testPhoneDefault) {
        setTestPhone(testPhoneDefault);
      }
      setIsSaved(false);
      setTestStatus({ loading: false, sent: false });
      setConnStatus({ loading: false, checked: false });
    }
  }, [isOpen, testPhoneDefault]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveEvolutionConfig(config);
    setIsSaved(true);
    if (onConfigSaved) {
      onConfigSaved(config);
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCheckConnection = async () => {
    if (!config.baseUrl || !config.apiKey) {
      setConnStatus({
        loading: false,
        checked: true,
        connected: false,
        message: "Preencha a URL da API e a Chave de API antes de testar a conexão.",
      });
      return;
    }

    setConnStatus({ loading: true, checked: false });
    const res = await checkEvolutionConnection(config);
    setConnStatus({
      loading: false,
      checked: true,
      connected: res.connected,
      message: res.connected 
        ? `Instância "${config.instanceName}" conectada com sucesso ao WhatsApp!` 
        : (res.error || `Estado atual: ${res.state || "desconectado"}. Verifique se o QR Code foi lido no painel da Evolution.`),
    });
  };

  const handleTestSend = async () => {
    if (!config.baseUrl || !config.apiKey) {
      setTestStatus({
        loading: false,
        sent: true,
        success: false,
        message: "Configure e salve a URL e a Chave da Evolution API primeiro.",
      });
      return;
    }

    setTestStatus({ loading: true, sent: false });

    // Salva automaticamente a config antes do teste
    saveEvolutionConfig(config);

    const testMessage = `🚀 *TESTE DE INTEGRAÇÃO - EVOLUTION API*

Olá! Esta é uma notificação automática de teste enviada pela *A Loja do Meu Namorado*.

✅ *Status:* Conexão com Evolution API estabelecida!
📱 *Destino:* ${testPhone}
⚡ *Instância:* ${config.instanceName}

Todos os pedidos realizados no site agora disparam alertas automaticamente sem necessidade de clique manual. ✨`;

    const res = await sendEvolutionMessage(testPhone, testMessage);

    if (res.success) {
      setTestStatus({
        loading: false,
        sent: true,
        success: true,
        message: `Mensagem enviada com sucesso para +${testPhone}! Verifique o aplicativo do WhatsApp.`,
      });
    } else {
      setTestStatus({
        loading: false,
        sent: true,
        success: false,
        message: `Falha no envio: ${res.error || "Verifique se a instância está aberta e com WhatsApp conectado."}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-neutral-300 w-full max-w-2xl rounded-xs shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-neutral-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xs flex items-center justify-center text-lg font-black">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Evolution API • Automação WhatsApp
                </h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded-xs uppercase">
                  100% Grátis & Aberto
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Disparo em segundo plano para o comprador e lojista sem custo por mensagem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg font-bold p-1 transition-colors"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-neutral-800 text-xs">
          
          {/* Seção 1: Credenciais da API */}
          <div className="flex flex-col gap-4 bg-neutral-50 p-4 border border-neutral-200 rounded-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="font-black text-xs uppercase tracking-wider text-neutral-900">
                1. Conexão do Servidor Evolution
              </span>
              <span className="text-[10px] text-neutral-500">Salvo no seu navegador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* URL Base */}
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="font-bold text-[11px] uppercase tracking-wider text-neutral-700">
                  URL da Evolution API *
                </label>
                <input
                  type="url"
                  placeholder="Ex: https://evolution.seuservidor.com ou http://localhost:8080"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value.trim() })}
                  className="border border-neutral-300 p-2.5 rounded-xs text-xs font-mono outline-none focus:border-black transition-colors"
                />
                <span className="text-[10px] text-neutral-500">
                  URL onde seu container da Evolution API está hospedado (Railway, Render, VPS ou Cloudflare Tunnel).
                </span>
              </div>

              {/* API Key */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[11px] uppercase tracking-wider text-neutral-700">
                  Chave de API (apikey) *
                </label>
                <input
                  type="password"
                  placeholder="AUTHENTICATION_API_KEY"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                  className="border border-neutral-300 p-2.5 rounded-xs text-xs font-mono outline-none focus:border-black transition-colors"
                />
                <span className="text-[10px] text-neutral-500">
                  Sua chave secreta global configurada na Evolution.
                </span>
              </div>

              {/* Nome da Instância */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[11px] uppercase tracking-wider text-neutral-700">
                  Nome da Instância *
                </label>
                <input
                  type="text"
                  placeholder="Ex: loja"
                  value={config.instanceName}
                  onChange={(e) => setConfig({ ...config, instanceName: e.target.value.trim() })}
                  className="border border-neutral-300 p-2.5 rounded-xs text-xs font-mono outline-none focus:border-black transition-colors"
                />
                <span className="text-[10px] text-neutral-500">
                  Nome da instância conectada ao WhatsApp da loja.
                </span>
              </div>
            </div>

            {/* Ações de salvamento e teste de conexão */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleSave}
                className="bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5"
              >
                <span>💾</span>
                <span>Salvar Configuração</span>
              </button>

              <button
                type="button"
                onClick={handleCheckConnection}
                disabled={connStatus.loading}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{connStatus.loading ? "⏳" : "🔍"}</span>
                <span>{connStatus.loading ? "Verificando..." : "Checar Conexão"}</span>
              </button>

              {isSaved && (
                <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                  ✓ Configuração salva!
                </span>
              )}
            </div>

            {/* Feedback de Conexão */}
            {connStatus.checked && (
              <div className={`p-3 rounded-xs text-xs font-medium border flex items-center gap-2 ${
                connStatus.connected 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-amber-50 border-amber-300 text-amber-800"
              }`}>
                <span>{connStatus.connected ? "🟢" : "⚠️"}</span>
                <span>{connStatus.message}</span>
              </div>
            )}
          </div>

          {/* Seção 2: Simular Disparo Real para o Comprador */}
          <div className="flex flex-col gap-3.5 bg-white p-4 border border-neutral-200 rounded-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="font-black text-xs uppercase tracking-wider text-neutral-900">
                2. Teste de Disparo Imediato
              </span>
              <span className="text-[10px] bg-neutral-100 font-mono px-2 py-0.5 rounded-xs font-bold text-neutral-700">
                Alvo: 55 55 99620-6060
              </span>
            </div>

            <p className="text-neutral-600">
              Teste o envio de uma mensagem real para o número do comprador solicitado pelo sistema:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="5555996206060"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="border border-neutral-300 p-2.5 rounded-xs text-xs font-mono outline-none focus:border-black flex-1"
              />

              <button
                type="button"
                onClick={handleTestSend}
                disabled={testStatus.loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{testStatus.loading ? "⏳" : "🚀"}</span>
                <span>{testStatus.loading ? "Enviando..." : "Disparar Teste Real"}</span>
              </button>
            </div>

            {testStatus.sent && (
              <div className={`p-3 rounded-xs text-xs font-medium border flex items-start gap-2 ${
                testStatus.success 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                  : "bg-red-50 border-red-300 text-red-800"
              }`}>
                <span className="text-base">{testStatus.success ? "✅" : "❌"}</span>
                <div>
                  <p className="font-bold">{testStatus.success ? "Sucesso no Disparo!" : "Erro ao Disparar"}</p>
                  <p className="mt-0.5">{testStatus.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Como Subir a Evolution API Grátis (Instruções Rápidas) */}
          <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xs flex flex-col gap-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-neutral-800">
              💡 Como subir sua Evolution API em 3 passos:
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-600 text-[11px]">
              <li>
                <strong>Crie o container:</strong> Pode ser via template 1-clique no <em>Railway</em>, <em>Render</em>, ou no seu próprio PC com <code>docker run -p 8080:8080 atendai/evolution-api:v2.1.2</code>.
              </li>
              <li>
                <strong>Conecte o WhatsApp:</strong> Abra a URL da sua Evolution no navegador (ou Evolution Manager), crie a instância <code>loja</code> e escaneie o QR Code com o WhatsApp da loja (+55 55 99957-6823).
              </li>
              <li>
                <strong>Cole a URL e Chave acima:</strong> Clique em &quot;Salvar Configuração&quot;. A partir deste momento, todos os pedidos serão entregues 100% de forma autônoma!
              </li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex justify-between items-center">
          <span className="text-[10px] text-neutral-500 font-bold">
            Fallback ativo: Se a API estiver offline, os botões manuais de 1 clique permanecem disponíveis.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-black text-white hover:bg-neutral-800 px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xs transition-colors"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
}
