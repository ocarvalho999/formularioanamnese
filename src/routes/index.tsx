import { createFileRoute } from "@tanstack/react-router";
import Quiz from "@/components/Quiz";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diagnóstico Mesoterapia Capilar — +R$60k em 90 dias | Bruno Carvalho" },
      {
        name: "description",
        content:
          "Quiz exclusivo para clínicas de mesoterapia capilar. Descubra como aumentar seu faturamento em R$60 mil ou mais nos próximos 90 dias.",
      },
      { property: "og:title", content: "Diagnóstico para Clínicas de Mesoterapia Capilar" },
      {
        property: "og:description",
        content:
          "Responda 5 etapas e receba um plano de ação para gerar leads e escalar sua clínica.",
      },
    ],
  }),
  component: Quiz,
});
