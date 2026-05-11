import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Calendar,
  Loader2,
  Zap,
} from "lucide-react";

const fbq = (type: "track" | "trackCustom", event: string, params?: Record<string, unknown>) => {
  try {
    if (typeof (window as unknown as { fbq?: Function }).fbq === "function")
      (window as unknown as { fbq: Function }).fbq(type, event, params);
  } catch { /* ignore */ }
};

type LeadData = {
  nome: string;
  whatsapp: string;
  email: string;
  tempoEmpresa: string;
  faturamento: string;
};

type QuizAnswers = Record<string, string>;
type Choice = { value: string; label: string; sub?: string; score: number };
type Question = { id: string; title: string; subtitle?: string; choices: Choice[] };

const TEMPO_OPTIONS: Choice[] = [
  { value: "menos-1", label: "Menos de 1 ano", score: 1 },
  { value: "1-3", label: "Entre 1 e 3 anos", score: 2 },
  { value: "3-5", label: "Entre 3 e 5 anos", score: 3 },
  { value: "5+", label: "Mais de 5 anos", score: 3 },
];
const FATURAMENTO_OPTIONS: Choice[] = [
  { value: "ate-30", label: "Até R$ 30 mil/mês", score: 1 },
  { value: "30-60", label: "Entre R$ 30k e R$ 60k", score: 2 },
  { value: "60-100", label: "Entre R$ 60k e R$ 100k", score: 3 },
  { value: "100+", label: "Acima de R$ 100k/mês", score: 3 },
];

const QUESTIONS: Question[] = [
  {
    id: "desafio_principal",
    title: "Qual é o seu MAIOR desafio no momento para aumentar vendas?",
    subtitle: "Escolha o que mais te incomoda hoje",
    choices: [
      { value: "leads", label: "Gerar leads", sub: "Ninguém me encontra", score: 3 },
      { value: "conversao", label: "Converter leads em vendas", sub: "Visitam mas não compram", score: 3 },
      { value: "retencao", label: "Reter clientes", sub: "Perdi clientes antigos", score: 2 },
      { value: "comeco", label: "Não sei por onde começar", sub: "Tudo está confuso", score: 3 },
    ],
  },
  {
    id: "investimento_ads",
    title: "Quanto você está investindo em anúncios/marketing por mês?",
    subtitle: "Some tudo: Meta Ads, Google Ads, agência, social media…",
    choices: [
      { value: "0", label: "Não invisto nada", sub: "Oportunidade enorme", score: 3 },
      { value: "500-1k", label: "R$ 500 a R$ 1.000", sub: "Investimento baixo", score: 2 },
      { value: "1-5k", label: "R$ 1.000 a R$ 5.000", sub: "Investimento médio", score: 3 },
      { value: "5k+", label: "Mais de R$ 5.000", sub: "Já investe bem", score: 3 },
    ],
  },
  {
    id: "urgencia_interesse",
    title:
      "Se você pudesse aumentar seu faturamento em R$10.000+ nos próximos 90 dias, qual seria seu nível de interesse?",
    subtitle: "Seja honesto — isso define se faz sentido conversarmos",
    choices: [
      { value: "muito-alto", label: "Muito alto! Começaria já", sub: "Pronto pra agir", score: 3 },
      { value: "alto", label: "Alto, mas preciso pensar", sub: "Interessado", score: 3 },
      { value: "medio", label: "Médio, depende do investimento", sub: "Hesitante", score: 2 },
      { value: "baixo", label: "Baixo, acho caro", sub: "Sem interesse agora", score: 1 },
    ],
  },
  {
    id: "comprometimento",
    title:
      "Você está disposto a fazer mudanças nas suas estratégias de marketing se isso impactar diretamente no faturamento?",
    subtitle: "Resultados novos exigem ações novas",
    choices: [
      { value: "totalmente", label: "Sim, totalmente aberto a mudanças", score: 3 },
      { value: "entender", label: "Sim, mas preciso entender bem antes", score: 3 },
      { value: "talvez", label: "Talvez, depende da estratégia", score: 2 },
      { value: "nao", label: "Não, prefiro continuar como está", score: 1 },
    ],
  },
  {
    id: "cenario_atual",
    title: "Atualmente, como você está gerando leads (consultas)?",
    subtitle: "Escolha a que mais se aproxima da sua realidade",
    choices: [
      { value: "indicacoes", label: "Principalmente por indicações", sub: "Boca a boca", score: 3 },
      { value: "social-sem", label: "Redes sociais / anúncios", sub: "Mas sem estratégia", score: 3 },
      { value: "ads-estruturado", label: "Google Ads / Meta Ads estruturado", sub: "Operação rodando", score: 2 },
      { value: "mistura", label: "Mistura de várias estratégias", sub: "Sem foco claro", score: 2 },
    ],
  },
  {
    id: "fechamento",
    title:
      "Se eu mostrasse exatamente como uma clínica saiu do prejuízo e faturou R$60mil+ em 90 dias, você gostaria de saber os detalhes na call?",
    subtitle: "Mesmo método, aplicado ao seu cenário",
    choices: [
      { value: "clonar", label: "Sim! Quero clonar esse resultado", sub: "Pronto pra reunião", score: 3 },
      { value: "socio", label: "Sim, mas preciso confirmar com meu sócio", sub: "Decisão compartilhada", score: 3 },
      { value: "talvez", label: "Talvez, depende dos detalhes", sub: "Curioso", score: 2 },
      { value: "nao", label: "Não tenho interesse agora", sub: "Não é o momento", score: 1 },
    ],
  },
];

const ENCOURAGEMENTS = [
  "Ótimo! Você está indo muito bem 🚀",
  "Excelente escolha! Estamos chegando lá",
  "Boa! Cada resposta afina sua estratégia",
  "Top! Você é objetivo(a), adoramos isso",
  "Quase lá! Última reta",
];

// Total de telas: 0 = dados, 1..6 = perguntas, 7 = resultado
const TOTAL_QUESTIONS = QUESTIONS.length;
const LAST_STEP = TOTAL_QUESTIONS + 1; // 7

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [lead, setLead] = useState<LeadData>({
    nome: "",
    whatsapp: "",
    email: "",
    tempoEmpresa: "",
    faturamento: "",
  });
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playPing = (freq = 880) => {
    try {
      if (typeof window === "undefined") return;
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      o.stop(ctx.currentTime + 0.2);
    } catch {
      /* ignore */
    }
  };

  // Progresso global 0..100
  const progress = useMemo(() => {
    if (step === 0) return 8;
    if (step >= LAST_STEP) return 100;
    return Math.round((step / (TOTAL_QUESTIONS + 1)) * 100) + 5;
  }, [step]);

  const score = useMemo(() => {
    let s = 0;
    s += TEMPO_OPTIONS.find((o) => o.value === lead.tempoEmpresa)?.score ?? 0;
    s += FATURAMENTO_OPTIONS.find((o) => o.value === lead.faturamento)?.score ?? 0;
    QUESTIONS.forEach((q) => {
      const a = answers[q.id];
      const c = q.choices.find((ch) => ch.value === a);
      if (c) s += c.score;
    });
    return s;
  }, [lead, answers]);

  const isHotLead = score >= 14;

  const validateLead = () =>
    lead.nome.trim().length >= 2 &&
    lead.whatsapp.replace(/\D/g, "").length >= 10 &&
    lead.tempoEmpresa &&
    lead.faturamento;

  // Pergunta atual
  const questionIndex = step >= 1 && step <= TOTAL_QUESTIONS ? step - 1 : -1;
  const currentQuestion = questionIndex >= 0 ? QUESTIONS[questionIndex] : null;
  const currentAnswered = currentQuestion ? !!answers[currentQuestion.id] : true;

  const triggerCelebration = () => {
    setConfettiKey((k) => k + 1);
    setFlashSuccess(true);
    playPing(920);
    setTimeout(() => setFlashSuccess(false), 700);
  };

  const handleSelect = (qid: string, value: string) => {
    const already = answers[qid] === value;
    setAnswers((a) => ({ ...a, [qid]: value }));
    if (!already) triggerCelebration();
  };

  const goNext = () => {
    if (step === 0) {
      if (!validateLead()) return;
      fbq("track", "CompleteRegistration");
      playPing(740);
      setFeedback("Ótimo! Você está na Etapa 2 de 5 🚀");
      setTimeout(() => setFeedback(null), 1600);
      setStep(1);
      return;
    }
    if (currentQuestion && !currentAnswered) return;
    if (step < TOTAL_QUESTIONS) {
      if (step === 3) fbq("track", "ViewContent");
      const msg = ENCOURAGEMENTS[Math.min(step - 1, ENCOURAGEMENTS.length - 1)];
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 1500);
      playPing(740);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    setSubmitting(true);
    try {
      const SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzU_9P4w7ZZjqy7jyXi8NWGJWpubfm01AYgyLI1f0b6PptduitTu1BzSa5Gv65yyUeJkQ/exec";
      if (SHEET_WEBHOOK) {
        await fetch(SHEET_WEBHOOK, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            nome: lead.nome,
            whatsapp: lead.whatsapp,
            email: lead.email,
            tempoEmpresa: lead.tempoEmpresa,
            faturamento: lead.faturamento,
            desafio_principal: answers.desafio_principal ?? "",
            investimento_ads: answers.investimento_ads ?? "",
            urgencia_interesse: answers.urgencia_interesse ?? "",
            comprometimento: answers.comprometimento ?? "",
            cenario_atual: answers.cenario_atual ?? "",
            fechamento: answers.fechamento ?? "",
            score,
          }),
        });
      }
    } catch {
      // não bloqueia o fluxo se o envio falhar
    }
    fbq("trackCustom", "QuizCompleto", { score });
    setSubmitting(false);
    triggerCelebration();
    playPing(1100);
    setStep(LAST_STEP);
  };

  // Etapa visível 1..5: dados=1; perguntas 1-2 → etapa 2; 3-4 → etapa 3; 5 → etapa 4; 6 → etapa 5
  const visibleStep =
    step === 0 ? 1 : step <= 2 ? 2 : step <= 4 ? 3 : step === 5 ? 4 : 5;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16 relative overflow-hidden">
      {/* Confetti */}
      {confettiKey > 0 && <Confetti key={confettiKey} />}

      <div className="w-full max-w-2xl relative">
        {/* Header */}
        <div className="text-center mb-8 slide-in-right">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/60 backdrop-blur border border-primary/30 text-xs uppercase tracking-wider text-primary font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Diagnóstico exclusivo · Bruno Carvalho
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Vamos descobrir o{" "}
            <span className="text-gradient">potencial da sua clínica</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Responda 5 etapas rápidas e receba um plano de ação personalizado.
          </p>
        </div>

        {/* Progress global */}
        {step < LAST_STEP && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">
                Etapa <span className="text-primary font-bold">{visibleStep}</span> de 5
              </span>
              <span className="text-primary font-semibold tabular-nums">{progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="progress-bar-fill h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div
          key={step}
          className={cn(
            "quiz-pop rounded-3xl border bg-card/85 backdrop-blur shadow-card p-6 sm:p-10 transition-shadow duration-500",
            flashSuccess
              ? "border-[oklch(0.88_0.27_152)] shadow-glow-success"
              : "border-border",
          )}
        >
          {step === 0 && <LeadStep lead={lead} setLead={setLead} />}
          {currentQuestion && (
            <QuestionBlock
              question={currentQuestion}
              index={questionIndex}
              total={TOTAL_QUESTIONS}
              value={answers[currentQuestion.id]}
              onChange={(v) => handleSelect(currentQuestion.id, v)}
            />
          )}
          {step === LAST_STEP && <FinalStep lead={lead} isHotLead={isHotLead} />}

          {/* Nav */}
          {step < LAST_STEP && (
            <div className="mt-10 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={step === 0 || submitting}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              {step < TOTAL_QUESTIONS ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={goNext}
                  disabled={
                    (step === 0 && !validateLead()) ||
                    (step >= 1 && !currentAnswered)
                  }
                  className="bg-gradient-primary text-primary-foreground hover:brightness-110 hover:scale-[1.02] active:scale-100 transition-all shadow-glow font-bold px-8"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={submit}
                  disabled={!currentAnswered || submitting}
                  className="bg-gradient-primary text-primary-foreground hover:brightness-110 transition-all shadow-glow font-bold px-8 pulse-glow"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analisando suas respostas…
                    </>
                  ) : (
                    <>
                      Ver meu diagnóstico
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          🔒 Suas informações estão seguras. Não enviamos spam.
        </p>
      </div>

      {/* Toast feedback */}
      {feedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 quiz-pop">
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-success text-success-foreground shadow-glow-success text-sm font-bold pulse-success">
            <Zap className="w-4 h-4" />
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  // Gera 24 confetes com posições e cores aleatórias
  const pieces = useMemo(() => {
    const colors = [
      "oklch(0.82 0.15 224)",
      "oklch(0.88 0.27 152)",
      "oklch(0.88 0.16 195)",
      "oklch(0.95 0.18 175)",
    ];
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 30 + Math.random() * 40,
      cx: (Math.random() - 0.5) * 320,
      cr: 360 + Math.random() * 720,
      bg: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 120,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
    }));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: p.bg,
              width: p.w,
              height: p.h,
              animationDelay: `${p.delay}ms`,
              ["--cx" as string]: `${p.cx}px`,
              ["--cr" as string]: `${p.cr}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function LeadStep({
  lead,
  setLead,
}: {
  lead: LeadData;
  setLead: React.Dispatch<React.SetStateAction<LeadData>>;
}) {
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vamos começar 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Conte um pouco sobre você e sua clínica.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Seu nome completo *</Label>
          <Input
            id="nome"
            value={lead.nome}
            onChange={(e) => setLead({ ...lead, nome: e.target.value })}
            placeholder="Como devemos te chamar?"
            maxLength={80}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp *</Label>
          <Input
            id="whatsapp"
            value={lead.whatsapp}
            onChange={(e) => setLead({ ...lead, whatsapp: formatPhone(e.target.value) })}
            placeholder="(11) 99999-9999"
            inputMode="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={lead.email}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
            placeholder="seu@email.com"
            maxLength={120}
          />
        </div>
      </div>

      <SelectGroup
        label="Há quanto tempo sua clínica está aberta? *"
        options={TEMPO_OPTIONS}
        value={lead.tempoEmpresa}
        onChange={(v) => setLead({ ...lead, tempoEmpresa: v })}
      />
      <SelectGroup
        label="Faturamento líquido médio dos últimos 3 meses *"
        options={FATURAMENTO_OPTIONS}
        value={lead.faturamento}
        onChange={(v) => setLead({ ...lead, faturamento: v })}
      />
    </div>
  );
}

function SelectGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Choice[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "text-left rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200",
              value === opt.value
                ? "border-primary bg-primary/15 text-foreground shadow-glow"
                : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary/70 hover:scale-[1.02]",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionBlock({
  question,
  index,
  total,
  value,
  onChange,
}: {
  question: Question;
  index: number;
  total: number;
  value?: string;
  onChange: (v: string) => void;
}) {
  // Force re-mount animation on question change
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => setAnimKey((k) => k + 1), [question.id]);

  return (
    <div key={animKey} className="quiz-pop">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary/15 border border-primary/40">
          {index + 1}
        </span>
        Pergunta {index + 1} de {total}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">{question.title}</h2>
      {question.subtitle && (
        <p className="text-muted-foreground text-sm mt-2">{question.subtitle}</p>
      )}
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {question.choices.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className={cn(
                "group text-left rounded-2xl border px-4 py-4 transition-all duration-200",
                selected
                  ? "border-[oklch(0.88_0.27_152)] bg-[oklch(0.88_0.27_152/0.12)] shadow-glow-success scale-[1.02]"
                  : "border-border bg-secondary/40 hover:border-primary/70 hover:bg-secondary/70 hover:scale-[1.02]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    selected
                      ? "border-[oklch(0.88_0.27_152)] bg-[oklch(0.88_0.27_152)]"
                      : "border-muted-foreground/40 group-hover:border-primary",
                  )}
                >
                  {selected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.15_0_0)]" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-sm">{c.label}</div>
                  {c.sub && (
                    <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FinalStep({ lead, isHotLead }: { lead: LeadData; isHotLead: boolean }) {
  const firstName = lead.nome.split(" ")[0] || "você";
  const calendarUrl = "https://calendly.com/brunocarvalho452/reuniao-estrategica-bruno-carvalho?month=2026-05";

  return (
    <div className="text-center space-y-6 quiz-pop">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary shadow-glow mx-auto pulse-glow">
        <TrendingUp className="w-10 h-10 text-primary-foreground" />
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Pronto, {firstName}! Vimos que você é uma{" "}
          <span className="text-gradient">
            {isHotLead ? "ÓTIMA oportunidade" : "boa oportunidade"}
          </span>{" "}
          para escalar sua clínica.
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          {isHotLead
            ? "Pelo seu perfil, com a estratégia certa você pode adicionar R$60 mil ou mais em faturamento nos próximos 90 dias. Agende agora uma reunião BREVE e gratuita com Bruno Carvalho."
            : "Bruno vai te mostrar exatamente quais ajustes destravam mais leads e vendas para sua clínica. Agende uma conversa breve e sem compromisso."}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 max-w-md mx-auto text-left">
        {[
          "Diagnóstico real do seu funil",
          "Plano de ação personalizado",
          "Sem compromisso",
        ].map((b) => (
          <div
            key={b}
            className="rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            {b}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <a
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => fbq("track", "Schedule")}
        >
          <Button
            size="lg"
            className="bg-gradient-primary text-primary-foreground hover:brightness-110 transition-all shadow-glow font-bold px-8 pulse-glow w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4" />
            Agendar reunião estratégica
          </Button>
        </a>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        ⚡ Vagas limitadas. Bruno atende pessoalmente apenas algumas clínicas por semana.
      </p>
    </div>
  );
}
