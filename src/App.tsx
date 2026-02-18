import "./App.css"
import Hero from "./components/Hero"
import Services from "./components/Services"
import WhyChoose from "./components/WhyChoose"
import WhatsAppCTA from "./components/WhatsAppCTA"
import AssistantWidgetPlaceholder from "./components/AssistantWidgetPlaceholder"

function App() {
  return (
    <div className="page">
      <Hero />
      <Services />
      <WhyChoose />
      <WhatsAppCTA />
      <AssistantWidgetPlaceholder />
    </div>
  )
}

export default App
