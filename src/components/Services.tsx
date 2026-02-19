import SectionShell from "./SectionShell"

type Service = {
  title: string
  description: string
}

const services: Service[] = [
  {
    title: "Topografia",
    description:
      "Levantamentos e medições com precisão para terrenos, obras e projetos. Base técnica confiável para decisões e execução.",
  },
  {
    title: "Geoprocessamento",
    description:
      "Mapas, análises e organização de dados para apoiar planejamento, licenças e gestão ambiental com mais clareza.",
  },
  {
    title: "Licenciamento ambiental",
    description:
      "Orientação e suporte para conduzir processos com organização, comunicação clara e foco em reduzir riscos e retrabalho.",
  },
]

export default function Services() {
  return (
    <div id="services">
      <SectionShell
        title="Serviços essenciais"
        subtitle="Um resumo direto do que entregamos com qualidade e responsabilidade técnica."
      >
        <div className="grid">
          {services.map((s) => (
            <article key={s.title} className="card" aria-label={s.title}>
              <h3 className="card-title">{s.title}</h3>
              <p className="card-text">{s.description}</p>
            </article>
          ))}
        </div>

        <p className="note">
          Também atendemos demandas como gestão de resíduos, engenharia florestal e hidrologia,
          conforme a necessidade do projeto.
        </p>
      </SectionShell>
    </div>
  )
}
