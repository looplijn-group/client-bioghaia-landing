import SectionShell from "./SectionShell"

type Service = {
  title: string
  description: string
}

const services: Service[] = [
  {
    title: "Service 1",
    description: "Short description of the first service.",
  },
  {
    title: "Service 2",
    description: "Short description of the second service.",
  },
  {
    title: "Service 3",
    description: "Short description of the third service.",
  },
]

export default function Services() {
  return (
    <SectionShell
      title="Services"
      subtitle="A clear, simple overview of what we deliver."
    >
      <div className="grid">
        {services.map((s) => (
          <div key={s.title} className="card">
            <h3 className="card-title">{s.title}</h3>
            <p className="card-text">{s.description}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
