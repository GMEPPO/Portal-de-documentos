"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bot, ExternalLink, FileText, FlaskConical, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppUser } from "@/lib/types";

type Source = { name: string; version: string; href: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const KNOWLEDGE_BASE = [
  { name: "Regulamento Interno", pages: 42 },
  { name: "Política de Férias e Ausências", pages: 18 },
  { name: "Manual de Despesas e Reembolsos", pages: 24 },
  { name: "Código de Conduta", pages: 31 },
  { name: "Procedimento de Segurança de Dados", pages: 19 },
  { name: "Modelos de Contrato", pages: 56 },
  { name: "Guia de Integração de Novos Colaboradores", pages: 28 },
  { name: "Política de Trabalho Remoto", pages: 14 },
];

const SUGGESTIONS = [
  "Explica-me o processo interno desde que uma encomenda de cliente entra",
  "Qual é a política de férias?",
  "Como submeto despesas para reembolso?",
  "Onde encontro o regulamento interno?",
];

function src(name: string, version: string): Source {
  return { name, version, href: `/documents?q=${encodeURIComponent(name)}` };
}

function matchResponse(query: string): { content: string; sources: Source[] } {
  const q = query.toLowerCase();

  if (q.match(/f[eé]rias|aus[eê]ncias|folgas|licen[cç]a/)) {
    return {
      content:
        "De acordo com a **Política de Férias e Ausências**, cada colaborador tem direito a 22 dias úteis de férias por ano civil. As férias devem ser solicitadas com um mínimo de 15 dias de antecedência através do sistema, salvo situações de força maior. Em caso de doença, a ausência deve ser comunicada no próprio dia antes do início do período de trabalho, e o comprovativo médico apresentado até 5 dias após o regresso.\n\nA marcação de férias em períodos de maior procura (julho, agosto e dezembro) fica sujeita a aprovação do responsável de departamento, que tem 5 dias úteis para responder.",
      sources: [src("Política de Férias e Ausências", "v3")],
    };
  }

  if (q.match(/despesas|reembolso|despesa|nota de despesas|recibo/)) {
    return {
      content:
        "O processo de reembolso de despesas está descrito no **Manual de Despesas e Reembolsos**. As despesas profissionais devem ser submetidas através do portal interno, acompanhadas dos respectivos comprovativos originais, no prazo máximo de 30 dias após a sua realização.\n\nAs categorias elegíveis incluem: deslocações em viatura própria (0,36 €/km), transporte público, alojamento e refeições em contexto de deslocação oficial. Despesas superiores a 150 € requerem pré-autorização do responsável direto. Os reembolsos são processados no ciclo de pagamento seguinte ao da aprovação.",
      sources: [src("Manual de Despesas e Reembolsos", "v2")],
    };
  }

  if (q.match(/encomenda|order|cliente|processo interno|desde que/)) {
    return {
      content:
        "Com base nos procedimentos internos documentados, o fluxo desde a entrada de uma encomenda de cliente segue estas etapas:\n\n**1. Recepção e registo** — A encomenda é recebida (email, portal ou EDI) e registada no sistema com número único. O departamento Comercial valida os dados do cliente e confirma a disponibilidade.\n\n**2. Validação e aprovação** — O Comercial verifica crédito e condições contratuais. Encomendas acima do limite de crédito requerem aprovação da Direcção Financeira.\n\n**3. Planeamento e produção/logística** — A encomenda é transmitida ao departamento operacional responsável (Produção, Compras ou Armazém) para planeamento e execução.\n\n**4. Expedição** — O armazém prepara e expede a mercadoria. É gerada a documentação de transporte (guia de remessa, CMR ou equivalente).\n\n**5. Facturação e fecho** — Após confirmação de entrega, a Facturação emite a factura. O ciclo fecha com o registo de pagamento.\n\nO procedimento completo, incluindo os tempos de resposta por etapa e as responsabilidades por departamento, está documentado nos ficheiros de processo indexados.",
      sources: [
        src("Receção, criação e registo de proposta", "v2"),
        src("Regulamento Interno", "v3"),
      ],
    };
  }

  if (q.match(/regulamento|regras|normas|pol[ií]tica intern/)) {
    return {
      content:
        "O **Regulamento Interno** define as normas gerais de funcionamento da organização. Está estruturado em 8 capítulos que cobrem: horário de trabalho, código de conduta, uso de recursos da empresa, segurança e saúde no trabalho, comunicações internas, propriedade intelectual, regime disciplinar e resolução de conflitos.\n\nO documento foi revisto em 2025 e a versão em vigor é a 3.2. Todos os colaboradores são obrigados a confirmar a leitura do regulamento no momento da integração e aquando de actualizações relevantes.",
      sources: [src("Regulamento Interno", "v3"), src("Código de Conduta", "v2")],
    };
  }

  if (q.match(/contrato|acordo|minuta|modelo/)) {
    return {
      content:
        "O ficheiro **Modelos de Contrato** contém os templates oficiais aprovados pelo departamento jurídico para os seguintes tipos de contrato: contrato de trabalho a termo certo, contrato de trabalho sem termo, contrato de prestação de serviços, acordo de confidencialidade (NDA) e contrato de estágio.\n\nTodos os contratos devem ser emitidos através dos modelos em vigor. Qualquer alteração ao texto-padrão requer validação prévia do departamento jurídico. Os modelos são actualizados anualmente ou sempre que a legislação aplicável sofra alterações.",
      sources: [src("Modelos de Contrato", "v4")],
    };
  }

  if (q.match(/remoto|teletrabalho|home.?office|trabalhar em casa/)) {
    return {
      content:
        "A **Política de Trabalho Remoto** permite até 2 dias de teletrabalho por semana para funções elegíveis, mediante acordo com o responsável direto. O colaborador deve garantir um ambiente de trabalho adequado e ligação à internet estável.\n\nNos dias de teletrabalho, a disponibilidade deve ser igual à presencial — horário e tempo de resposta — e a participação em reuniões por videoconferência é obrigatória quando convocada. A política exclui o período de integração (primeiros 3 meses) e pode ser suspensa por razões operacionais.",
      sources: [src("Política de Trabalho Remoto", "v1")],
    };
  }

  if (q.match(/seguran[cç]a|dados|rgpd|privacidade|gdpr/)) {
    return {
      content:
        "O **Procedimento de Segurança de Dados** estabelece as regras para o tratamento de informação pessoal e confidencial, em conformidade com o RGPD. Os colaboradores não devem partilhar dados pessoais de clientes ou colegas sem base legal adequada, e devem reportar imediatamente qualquer incidente de segurança ao responsável de proteção de dados.\n\nO acesso a sistemas e ficheiros deve ser feito exclusivamente através de equipamentos e redes autorizados pela empresa. Passwords devem ter um mínimo de 12 caracteres e ser renovadas a cada 90 dias.",
      sources: [src("Procedimento de Segurança de Dados", "v2")],
    };
  }

  if (q.match(/integra[cç][aã]o|onboarding|novo colaborador|integrar/)) {
    return {
      content:
        "O **Guia de Integração de Novos Colaboradores** descreve o processo de acolhimento nos primeiros 90 dias. Inclui: sessão de boas-vindas com RH no 1.º dia, atribuição de buddy/mentor durante as primeiras 4 semanas, formações obrigatórias nos primeiros 30 dias (segurança, RGPD, regulamento interno) e reuniões de acompanhamento ao final do 1.º, 2.º e 3.º mês.\n\nO documento também contém a checklist completa para os responsáveis de integração e os acessos e equipamentos que devem estar prontos antes do início.",
      sources: [src("Guia de Integração de Novos Colaboradores", "v1")],
    };
  }

  const randomCount = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...KNOWLEDGE_BASE].sort(() => 0.5 - Math.random()).slice(0, randomCount);
  return {
    content: `Analisei a base de conhecimento e encontrei ${randomCount} documentos com informação relevante para a sua questão. Com base nesses documentos, posso dizer que a organização tem políticas e procedimentos detalhados que cobrem este tema.\n\nNa versão completa deste assistente, a resposta seria fundamentada nas secções específicas de cada documento, com citações directas e referências às páginas correspondentes. O agente IA seria capaz de cruzar informação entre vários documentos para dar uma resposta abrangente e precisa.`,
    sources: shuffled.map((d) => src(d.name, "v1")),
  };
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! Sou o assistente de documentos da Gestão Documental. Posso responder a questões sobre as políticas, regulamentos e procedimentos da organização com base nos documentos disponíveis.\n\nComo posso ajudar?",
  sources: [],
};

export function TiraDuvidasClient({ user }: { user: AppUser }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage(text?: string) {
    const query = (text ?? input).trim();
    if (!query || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const { content, sources } = matchResponse(query);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 1200 + Math.random() * 600);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Tira dúvidas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Assistente IA com base de conhecimento documental
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <FlaskConical className="h-3 w-3" />
          Demo
        </span>
      </div>

      {/* DEMO banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className="text-sm text-amber-300">
          <span className="font-semibold">Demonstração — não operacional.</span> Este chatbot
          apresenta respostas simuladas para ilustrar o funcionamento previsto. Nenhuma consulta é
          enviada para um modelo de IA real.
        </p>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Knowledge base sidebar */}
        <aside className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Base de Conhecimento</h2>
          </div>
          <p className="text-xs text-slate-500">
            Documentos que o agente utilizará como fonte
          </p>
          <ul className="space-y-2">
            {KNOWLEDGE_BASE.map((doc) => (
              <li
                key={doc.name}
                className="flex items-start gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2"
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-300">{doc.name}</p>
                  <p className="text-[10px] text-slate-500">{doc.pages} páginas</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  indexado
                </span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-dashed border-slate-600 px-3 py-2 text-center">
            <p className="text-[10px] text-slate-500">
              Na versão final, todos os documentos carregados no portal serão indexados
              automaticamente
            </p>
          </div>
        </aside>

        {/* Chat panel */}
        <div className="flex flex-col rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Assistente IA</p>
              <p className="text-[10px] text-slate-500">Gestão Documental · Powered by base documental</p>
            </div>
            <span className="ml-auto rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Demo
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 380, maxHeight: 500 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                    msg.role === "user"
                      ? "bg-amber-500/25 text-amber-300"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-amber-500/20 text-amber-100"
                        : "rounded-tl-sm bg-slate-700/60 text-slate-200"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-500">Fontes:</span>
                      {msg.sources.map((source) => (
                        <Link
                          key={source.name}
                          href={source.href}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
                        >
                          <FileText className="h-2.5 w-2.5 shrink-0" />
                          <span>{source.name}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">{source.version}</span>
                          <ExternalLink className="h-2 w-2 shrink-0 text-slate-600" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-300">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-700/60 px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && !isTyping && (
            <div className="border-t border-slate-700/60 px-4 py-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Sugestões</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-full border border-slate-600 bg-slate-700/40 px-3 py-1 text-xs text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-700 px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder="Escreva a sua questão..."
                className="flex-1 rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                size="sm"
                className="bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-center text-[10px] text-slate-600">
              Este agente utilizará os documentos do portal como base de conhecimento · versão completa prevista
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
