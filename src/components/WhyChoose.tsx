import SectionShell from "./SectionShell"

const reasons = [
  {
    title: "Trust & clarity",
    text: "Clear steps, clear deliverables, clear communication.",
  },
  {
    title: "Fast and organized",
    text: "A realistic timeline with practical guidance throughout the process.",
  },
  {
    title: "Risk reduction",
    text: "Better decisions with the right information, preventing rework and delays.",
  },
]

export default function WhyChoose() {
  return (
    <SectionShell title="Why choose us" subtitle="Simple reasons that build trust.">
      <div className="grid">
        {reasons.map((r) => (
          <div key={r.title} className="card">
            <h3 className="card-title">{r.title}</h3>
            <p className="card-text">{r.text}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
