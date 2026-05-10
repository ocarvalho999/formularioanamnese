import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";

type LeadData = {
  nome: string;
  whatsapp: string;
  email: string;
  tempoEmpresa: string;
  faturamento: string;
};

type QuizAnswers = Record<string, string>;

type Choice = { value: string; label: string; sub?: string; score: number };

type Question = {
  id: string;
  title: string;
  subtitle?: string;
  choices: Choice[];
};

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
    title: "Se você pudesse aumentar seu faturamento em R$10.000+ nos próximos 90 dias, qual seria seu nível de interesse?",
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
    title: "Você está disposto a fazer mudanças nas suas estratégias de marketing se isso impactar diretamente no faturamento?",
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
    title: "Se eu mostrasse exatamente como uma clínica saiu do prejuízo e faturou R$60mil+ em 90 dias, você gostaria de saber os detalhes na call?",
    subtitle: "Mesmo método, aplicado ao seu cenário",
    choices: [
      { value: "clonar", label: "Sim! Quero clonar esse resultado", sub: "Pronto pra reunião", score: 3 },
      { value: "socio", label: "Sim, mas preciso confirmar com meu sócio", sub: "Decisão compartilhada", score: 3 },
      { value: "talvez", label: "Talvez, depende dos detalhes", sub: "Curioso", score: 2 },
      { value: "nao", label: "Não tenho interesse agora", sub: "Não é o momento", score: 1 },
    ],
  },
];

// Etapa 1 = dados, depois 6 perguntas em 4 etapas (2,2,1,1)
const STEP_GROUPS: number[][] = [
  [0, 1],
  [2, 3],
  [4],
  [5],
];

const TOTAL_STEPS = 1 + STEP_GROUPS.length + 1; // dados + grupos + final
// Etapas exibidas como 5: dados (1), 4 grupos de perguntas (2-5)

export default function Quiz() {
  const [step, setStep] = useState(0); // 0 = dados, 1..4 = perguntas, 5 = final
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

  const visibleStep = step + 1; // 1..5 mostrado ao usuário
  const totalVisibleSteps = 5;
  const progress = useMemo(() => {
    if (step === 0) return 12;
    if (step >= STEP_GROUPS.length + 1) return 100;
    return Math.round(((step) / (STEP_GROUPS.length + 1)) * 100) + 5;
  }, [step]);

  const score = useMemo(() => {
    let s = 0;
    const tempo = TEMPO_OPTIONS.find((o) => o.value === lead.tempoEmpresa);
    const fat = FATURAMENTO_OPTIONS.find((o) => o.value === lead.faturamento);
    if (tempo) s += tempo.score;
    if (fat) s += fat.score;
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

  const currentGroup = step >= 1 && step <= STEP_GROUPS.length ? STEP_GROUPS[step - 1] : null;
  const currentQuestionsAnswered =
    !currentGroup || currentGroup.every((qi) => answers[QUESTIONS[qi].id]);

  const goNext = () => {
    if (step === 0 && !validateLead()) return;
    if (currentGroup && !currentQuestionsAnswered) return;

    // feedback dopaminérgico
    const messages = [
      "Boa! Você está no caminho certo 🚀",
      "Excelente! Cada resposta nos ajuda a montar sua estratégia",
      "Top! Faltam poucas etapas",
      "Quase lá! Última reta",
    ];
    if (step >= 1 && step <= STEP_GROUPS.length) {
      setFeedback(messages[Math.min(step - 1, messages.length - 1)]);
      setTimeout(() => setFeedback(null), 1400);
    }
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    setSubmitting(true);
    // Aqui você plugaria webhook / Cloud. Por enquanto, simula.
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setStep(STEP_GROUPS.length + 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/60 backdrop-blur border border-border text-xs uppercase tracking-wider text-primary font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Diagnóstico exclusivo · Bruno Carvalho
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Descubra como sua clínica pode faturar{" "}
            <span className="text-gradient">+R$60 mil em 90 dias</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Responda 5 etapas rápidas e receba um plano de ação personalizado.
          </p>
        </div>

        {/* Progress */}
        {step <= STEP_GROUPS.length && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>
                Etapa{" "}
                <span className="text-primary font-bold">
                  {Math.min(visibleStep, totalVisibleSteps)}
                </span>{" "}
                de {totalVisibleSteps}
              </span>
              <span className="text-primary font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary" />
          </div>
        )}

        {/* Card */}
        <div
          key={step}
          className="quiz-pop rounded-3xl border border-border bg-card/80 backdrop-blur shadow-card p-6 sm:p-10"
        >
          {step === 0 && (
            <LeadStep lead={lead} setLead={setLead} />
          )}
          {step >= 1 && step <= STEP_GROUPS.length && currentGroup && (
            <div className="space-y-10">
              {currentGroup.map((qi) => (
                <QuestionBlock
                  key={QUESTIONS[qi].id}
                  question={QUESTIONS[qi]}
                  value={answers[QUESTIONS[qi].id]}
                  onChange={(v) =>
                    setAnswers((a) => ({ ...a, [QUESTIONS[qi].id]: v }))
                  }
                />
              ))}
            </div>
          )}
          {step === STEP_GROUPS.length + 1 && (
            <FinalStep lead={lead} isHotLead={isHotLead} />
          )}

          {/* Nav */}
          {step <= STEP_GROUPS.length && (
            <div className="mt-10 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={step === 0 || submitting}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              {step < STEP_GROUPS.length ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={goNext}
                  disabled={
                    (step === 0 && !validateLead()) ||
                    (currentGroup ? !currentQuestionsAnswered : false)
                  }
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold px-8"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={submit}
                  disabled={!currentQuestionsAnswered || submitting}
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold px-8 pulse-glow"
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

        {/* Toast feedback */}
        {feedback && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 quiz-pop">
            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground shadow-glow text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {feedback}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          🔒 Suas informações estão seguras. Não enviamos spam.
        </p>
      </div>
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
              "text-left rounded-xl border px-4 py-3 text-sm font-medium transition-all",
              value === opt.value
                ? "border-primary bg-primary/10 text-foreground shadow-glow"
                : "border-border bg-secondary/40 hover:border-primary/50 hover:bg-secondary/60",
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
  value,
  onChange,
}: {
  question: Question;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">{question.title}</h2>
      {question.subtitle && (
        <p className="text-muted-foreground text-sm mt-1.5">{question.subtitle}</p>
      )}
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {question.choices.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className={cn(
                "group text-left rounded-2xl border px-4 py-4 transition-all",
                selected
                  ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
                  : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary/70",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    selected ? "border-primary bg-primary" : "border-muted-foreground/40",
                  )}
                >
                  {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
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
  const calendarUrl = "https://calendly.com/brunocarvalho/diagnostico";
  const whatsappMsg = encodeURIComponent(
    `Olá Bruno! Acabei de fazer o diagnóstico no site. Meu nome é ${lead.nome} e quero agendar a reunião de estratégia.`,
  );
  const whatsappUrl = `https://wa.me/5511999999999?text=${whatsappMsg}`;

  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary shadow-glow mx-auto">
        <TrendingUp className="w-10 h-10 text-primary-foreground" />
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          {firstName}, sua clínica tem{" "}
          <span className="text-gradient">
            {isHotLead ? "altíssimo potencial" : "um potencial real"}
          </span>{" "}
          de crescimento.
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          {isHotLead
            ? "Pelo seu perfil, identificamos que com a estratégia certa você pode adicionar R$60 mil ou mais em faturamento nos próximos 90 dias. Agende agora uma reunião BREVE e gratuita com Bruno Carvalho."
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
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            {b}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <a href={calendarUrl} target="_blank" rel="noreferrer">
          <Button
            size="lg"
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold px-8 pulse-glow w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4" />
            Agendar reunião com Bruno
          </Button>
        </a>
        <a href={whatsappUrl} target="_blank" rel="noreferrer">
          <Button size="lg" variant="outline" className="border-primary/40 hover:bg-primary/10 w-full sm:w-auto">
            Falar no WhatsApp
          </Button>
        </a>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        ⚡ Vagas limitadas. Bruno atende pessoalmente apenas algumas clínicas por semana.
      </p>
    </div>
  );
}
