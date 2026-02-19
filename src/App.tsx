import "./App.css"
import Hero from "./components/Hero"
import Services from "./components/Services"
import WhyChoose from "./components/WhyChoose"
import WhatsAppCTA from "./components/WhatsAppCTA"
import QRWhatsApp from "./components/QRWhatsApp"
import FAQ from "./components/FAQ"
import AssistantWidget from "./components/AssistantWidget"
import Footer from "./components/Footer"

function App() {
  return (
    <div className="page">
      <header className="topbar" role="banner" aria-label="Bioghaia header">
        <div className="topbar-inner">
          <div className="brand" aria-label="Bioghaia Engenharia Ambiental">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-text">Bioghaia</span>
          </div>

          <nav className="topbar-nav" aria-label="Navegação">
            <a className="nav-link" href="#services">
              Serviços
            </a>
            <a className="nav-link" href="#why">
              Por que nós
            </a>
            <a className="nav-link" href="#faq">
              Dúvidas
            </a>
            <a className="nav-link" href="#contact">
              Contato
            </a>
          </nav>
        </div>
      </header>

      <main id="content" className="main" role="main">
        <Hero />

        <section className="section" aria-label="Conteúdo principal">
          <div className="section-inner">
            <div className="split">
              <div>
                <Services />
              </div>
              <div>
                <QRWhatsApp />
              </div>
            </div>
          </div>
        </section>

        <WhyChoose />
        <FAQ />
        <WhatsAppCTA />
      </main>

      <Footer />
      <AssistantWidget />
    </div>
  )
}

export default App
