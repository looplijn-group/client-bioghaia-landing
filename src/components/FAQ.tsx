export default function FAQ() {
  return (
    <section id="faq" className="section" aria-label="Perguntas frequentes">
      <div className="section-inner">
        <header className="section-header">
          <h2 className="section-title">Dúvidas frequentes</h2>
          <p className="section-subtitle">
            Respostas rápidas para você entender o processo e ganhar clareza.
          </p>
        </header>

        <div className="grid">
          <details className="card" aria-label="Como solicitar um orçamento?">
            <summary className="faq-summary">Como solicitar um orçamento?</summary>
            <p className="card-text">
              Envie uma mensagem no WhatsApp com: serviço desejado, cidade/região, tipo de empreendimento e prazo.
              Se tiver arquivo ou referência, pode anexar.
            </p>
          </details>

          <details className="card" aria-label="Vocês atendem o litoral do RS?">
            <summary className="faq-summary">Vocês atendem o litoral do RS?</summary>
            <p className="card-text">
              Sim. Atuamos no Rio Grande do Sul e em regiões estratégicas, incluindo a faixa litorânea conforme demanda.
            </p>
          </details>

          <details className="card" aria-label="Em quanto tempo vocês retornam?">
            <summary className="faq-summary">Em quanto tempo vocês retornam?</summary>
            <p className="card-text">
              Normalmente respondemos rapidamente durante horário comercial. Se sua demanda for urgente, informe no WhatsApp.
            </p>
          </details>
        </div>
      </div>
    </section>
  )
}
