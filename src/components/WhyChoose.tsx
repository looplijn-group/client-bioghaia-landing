import SectionShell from "./SectionShell"

const reasons = [
  {
    title: "Clareza e responsabilidade técnica",
    text: "Você entende o processo, os próximos passos e o que será entregue. Sem confusão e sem promessas vagas.",
  },
  {
    title: "Agilidade com organização",
    text: "Cronograma realista, comunicação direta e entregas bem definidas para evitar atrasos e retrabalho.",
  },
  {
    title: "Menos risco para o seu projeto",
    text: "Dados técnicos e orientação para decisões melhores, com foco em segurança, conformidade e previsibilidade.",
  },
]

export default function WhyChoose() {
  return (
    <div id="why">
      <SectionShell
        title="Por que escolher a Bioghaia"
        subtitle="Pontos simples que geram confiança e aceleram o seu projeto."
      >
        <div className="grid">
          {reasons.map((r) => (
            <article key={r.title} className="card" aria-label={r.title}>
              <h3 className="card-title">{r.title}</h3>
              <p className="card-text">{r.text}</p>
            </article>
          ))}
        </div>
      </SectionShell>
    </div>
  )
}
