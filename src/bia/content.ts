export type Lang = "pt" | "en"

export type BiaLocaleContent = {
  assistant: {
    name: string
    role: string
    intro: string
    menuTitle: string
    menuSubtitle: string
    supportLabel: string
    restartLabel: string
    backLabel: string
    inputPlaceholder: string
    submitLabel: string
    summaryTitle: string
    summaryIntro: string
    consentPrompt: string
    consentYes: string
    consentNo: string
    reviewTitle: string
    reviewIntro: string
    reviewConfirm: string
    reviewEdit: string
    reviewHuman: string
    reviewMenu: string
    successTitle: string
    successBody: string
    errorTitle: string
    errorBody: string
    fallbackTitle: string
    fallbackBody: string
    humanTitle: string
    humanBody: string
    privacyTitle: string
    privacyBody: string
    menuConfirmTitle: string
    menuConfirmBody: string
    openWhatsApp: string
    summaryReady: string
    summarySaved: string
    invalidInput: string
    clarificationTitle: string
    clarificationBody: string
    fallbackSimplerBody: string
    fallbackHumanBody: string
    consentDeclinedBody: string
    describeIntro: string
    editIntro: string
    leadSavedStatus: string
    whatsappPreparedStatus: string
    whatsappOpenedStatus: string
    savingStatus: string
    resumeIntro: string
    whatsappGenericPrefill: string
  }
  options: {
    products: string
    guided: string
    existing: string
    purchase: string
    team: string
    human: string
    back: string
    restart: string
    confirm: string
    edit: string
    menu: string
    anotherQuestion: string
    anotherOption: string
    purchaseInfo: string
    continue: string
    keepProgress: string
    startAgain: string
    continueRequest: string
    whatsapp: string
    phone: string
    email: string
    answerQuestion: string
    explainProducts: string
    existingSupport: string
    continueWhatsApp: string
    individual: string
    company: string
    publicOrganization: string
    other: string
    projectHelp: string
    whatsappDirect: string
    assist: string
    question: string
    anotherService: string
    stageIdea: string
    stagePlanning: string
    stageOngoing: string
    deadlineNone: string
    editField: string
    addNote: string
    skipNote: string
  }
  services: Array<{
    id: string
    name: string
    description: string
    audience: string
    safeNote: string
  }>
  intents: {
    main: string
    back: string
    restart: string
    human: string
    products: string
    purchase: string
    existing: string
    contact: string
    privacy: string
    cancel: string
  }
  fields: {
    name: string
    contact: string
    contactMethod: string
    customerType: string
    city: string
    objective: string
    projectStage: string
    deadline: string
    intent: string
    service: string
    note: string
    consent: string
    language: string
    source: string
  }
  prompts: {
    productsPrompt: string
    guidedPrompt: string
    existingPrompt: string
    purchasePrompt: string
    teamPrompt: string
    namePrompt: string
    contactPrompt: string
    contactMethodPrompt: string
    contactValuePrompt: string
    customerTypePrompt: string
    cityPrompt: string
    objectivePrompt: string
    projectStagePrompt: string
    deadlinePrompt: string
    describePrompt: string
    notePrompt: string
    summaryPrompt: string
    consentPrompt: string
    clarificationPrompt: string
  }
  validation: {
    invalidEmail: string
    invalidPhone: string
    invalidContact: string
    tooShort: string
  }
  faq: Array<{
    id: string
    question: string
    answer: string
  }>
}

export const biaContentByLang: Record<Lang, BiaLocaleContent> = {
  pt: {
    assistant: {
      name: "Bia",
      role: "Assistente digital da Bioghaia",
      intro: "Olá! 👋 Sou a Bia, assistente digital da Bioghaia. Como posso ajudar?",
      menuTitle: "Como posso ajudar hoje?",
      menuSubtitle: "Escolha uma opção ou escreva sua mensagem.",
      supportLabel: "Falar com a equipe",
      restartLabel: "Recomeçar",
      backLabel: "Voltar",
      inputPlaceholder: "Escreva sua mensagem",
      submitLabel: "Enviar",
      summaryTitle: "Resumo para a equipe da Bioghaia",
      summaryIntro: "Pronto. Aqui está um resumo organizado para a equipe da Bioghaia.",
      consentPrompt: "Posso encaminhar esses dados para a equipe da Bioghaia?",
      consentYes: "Sim, pode me contatar",
      consentNo: "Prefiro não compartilhar meus dados",
      reviewTitle: "Revise o resumo",
      reviewIntro: "Confira as informações abaixo. Se estiver tudo certo, posso enviar para o WhatsApp.",
      reviewConfirm: "Confirmar e continuar",
      reviewEdit: "Corrigir informações",
      reviewHuman: "Falar com a equipe",
      reviewMenu: "Voltar ao menu",
      successTitle: "Resumo preparado",
      successBody: "O resumo está pronto para ser enviado ao WhatsApp.",
      errorTitle: "Não foi possível concluir",
      errorBody: "Não foi possível salvar o resumo agora. Você pode copiar o texto abaixo e enviar pelo WhatsApp.",
      fallbackTitle: "Não encontrei uma resposta segura",
      fallbackBody: "Posso ajudar com os serviços da Bioghaia ou preparar um contato com a equipe.",
      humanTitle: "Encaminhamento para a equipe",
      humanBody: "Vou organizar sua mensagem para a equipe da Bioghaia.",
      privacyTitle: "Privacidade",
      privacyBody: "Os dados que você compartilhar serão usados apenas para entender sua solicitação e encaminhar o atendimento.",
      menuConfirmTitle: "Você já iniciou um pedido",
      menuConfirmBody: "Deseja manter as informações que já forneceu ou começar de novo?",
      openWhatsApp: "Abrir WhatsApp",
      summaryReady: "Resumo pronto",
      summarySaved: "Resumo salvo",
      invalidInput: "Não consegui interpretar essa mensagem com segurança. Posso ajudar com serviços, atendimento ou falar com a equipe.",
      clarificationTitle: "Quero ter certeza de que entendi",
      clarificationBody: "Escolha uma opção ou digite uma frase curta para me dizer o que você precisa.",
      fallbackSimplerBody: "Vamos simplificar. Escolha uma das opções abaixo.",
      fallbackHumanBody: "Posso encaminhar você para a equipe da Bioghaia. Quer seguir pelo WhatsApp?",
      consentDeclinedBody: "Sem problema. Não vou registrar seus dados. Você ainda pode falar com a equipe no WhatsApp quando quiser.",
      describeIntro: "Conte rapidamente o que você precisa e eu organizo os próximos passos.",
      editIntro: "O que você gostaria de corrigir?",
      leadSavedStatus: "Solicitação salva",
      whatsappPreparedStatus: "Resumo preparado para o WhatsApp",
      whatsappOpenedStatus: "WhatsApp aberto",
      savingStatus: "Salvando sua solicitação",
      resumeIntro: "Voltando de onde paramos.",
      whatsappGenericPrefill: "Olá! Vim pelo site da Bioghaia e gostaria de uma orientação inicial."
    },
    options: {
      products: "Conhecer os serviços",
      guided: "Encontrar uma opção relevante",
      existing: "Já sou cliente",
      purchase: "Solicitar atendimento",
      team: "Falar com a equipe",
      human: "Falar com a equipe",
      back: "Voltar",
      restart: "Recomeçar",
      confirm: "Confirmar e continuar",
      edit: "Corrigir informações",
      menu: "Voltar ao menu",
      anotherQuestion: "Tenho outra dúvida",
      anotherOption: "Ver outra opção",
      purchaseInfo: "Quero este serviço",
      continue: "Continuar",
      keepProgress: "Manter minhas informações",
      startAgain: "Começar de novo",
      continueRequest: "Continuar meu pedido",
      whatsapp: "WhatsApp",
      phone: "Telefone",
      email: "E-mail",
      answerQuestion: "Isso respondeu minha dúvida",
      explainProducts: "Quero entender melhor os serviços",
      existingSupport: "Quero suporte para um atendimento existente",
      continueWhatsApp: "Continuar no WhatsApp",
      individual: "Pessoa física",
      company: "Empresa",
      publicOrganization: "Órgão público",
      other: "Outro",
      projectHelp: "Preciso de ajuda com um projeto",
      whatsappDirect: "Ir para o WhatsApp",
      assist: "Quero atendimento",
      question: "Tenho uma dúvida",
      anotherService: "Ver outro serviço",
      stageIdea: "Ainda é uma ideia",
      stagePlanning: "Em planejamento",
      stageOngoing: "Já em andamento",
      deadlineNone: "Sem prazo definido",
      editField: "Corrigir um campo",
      addNote: "Adicionar observação",
      skipNote: "Seguir sem observação"
    },
    services: [
      {
        id: "licenciamento",
        name: "Licenciamento e Regularização Ambiental",
        description: "Apoio técnico para entender exigências, organizar documentos e avançar com mais clareza.",
        audience: "Propriedades, empreendimentos, obras e atividades com necessidade de orientação inicial.",
        safeNote: "A Bioghaia pode orientar sobre o processo e o próximo passo. Ela não diagnostica nem garante resultados."
      },
      {
        id: "topografia",
        name: "Topografia",
        description: "Levantamentos técnicos para apoiar planejamento, documentação e decisão com precisão.",
        audience: "Projetos que precisam de base técnica para terreno, obra ou propriedade.",
        safeNote: "A Bioghaia pode explicar a natureza do apoio técnico. Ela não substitui a análise profissional específica."
      },
      {
        id: "geoprocessamento",
        name: "Geoprocessamento",
        description: "Análise territorial e mapeamento para entender características do terreno e da região.",
        audience: "Projetos que precisam de leitura técnica do território.",
        safeNote: "A Bioghaia pode explicar o uso da análise territorial. Ela não substitui a avaliação técnica específica."
      },
      {
        id: "diagnostico",
        name: "Diagnóstico Ambiental",
        description: "Avaliação inicial para compreender exigências, riscos e próximos passos.",
        audience: "Casos que precisam de uma leitura inicial do cenário.",
        safeNote: "A Bioghaia pode ajudar a organizar o encaminhamento. Ela não substitui orientação técnica específica."
      },
      {
        id: "agricultura",
        name: "Agricultura e Reflorestamento",
        description: "Apoio técnico para propriedades rurais, manejo, CAR e planejamento no campo.",
        audience: "Propriedades rurais, lavouras e projetos de reflorestamento.",
        safeNote: "A Bioghaia pode orientar sobre o atendimento inicial. Ela não substitui a análise profissional específica."
      }
    ],
    intents: {
      main: "menu principal",
      back: "voltar",
      restart: "recomeçar",
      human: "pessoa",
      products: "produtos",
      purchase: "comprar",
      existing: "cliente",
      contact: "contato",
      privacy: "privacidade",
      cancel: "cancelar"
    },
    fields: {
      name: "nome",
      contact: "contato",
      contactMethod: "forma de contato",
      customerType: "tipo de cliente",
      city: "cidade",
      objective: "necessidade do projeto",
      projectStage: "etapa do projeto",
      deadline: "prazo",
      intent: "intenção",
      service: "serviço ou categoria",
      note: "observação",
      consent: "consentimento",
      language: "idioma",
      source: "origem"
    },
    prompts: {
      productsPrompt: "Estes são os serviços da Bioghaia. Escolha o que faz mais sentido para você.",
      guidedPrompt: "Conte rapidamente seu caso e eu indico o serviço mais adequado.",
      existingPrompt: "Você já é cliente? Conte seu caso ou escolha uma opção.",
      purchasePrompt: "Ótimo. Vou reunir alguns dados sobre sua solicitação.",
      teamPrompt: "Ótimo. Para falar com a equipe, me diga seu nome.",
      namePrompt: "Qual é o seu nome?",
      contactPrompt: "Qual é o melhor contato para retorno?",
      contactMethodPrompt: "Qual é o melhor canal para o contato?",
      contactValuePrompt: "Compartilhe seu número ou e-mail para contato.",
      customerTypePrompt: "Para entender seu pedido, você nos procura como pessoa física ou como organização?",
      cityPrompt: "Qual cidade ou estado devemos registrar?",
      objectivePrompt: "Qual é a principal necessidade do seu projeto?",
      projectStagePrompt: "Em que etapa o seu projeto está?",
      deadlinePrompt: "Existe algum prazo importante? Se não houver, tudo bem.",
      describePrompt: "Conte rapidamente o que você precisa.",
      notePrompt: "Quer adicionar alguma observação para a equipe?",
      summaryPrompt: "Posso revisar o resumo antes de encaminhar.",
      consentPrompt: "Posso encaminhar esses dados para a equipe da Bioghaia?",
      clarificationPrompt: "Escolha uma opção ou digite uma frase curta para me dizer o que você precisa."
    },
    validation: {
      invalidEmail: "Esse e-mail não parece válido. Pode conferir?",
      invalidPhone: "Esse número não parece válido. Pode conferir?",
      invalidContact: "Preciso de um e-mail ou telefone válido para o retorno.",
      tooShort: "Pode me dar um pouco mais de detalhe?"
    },
    faq: [
      {
        id: "who",
        question: "Quem a Bioghaia atende?",
        answer: "A Bioghaia atende proprietários, produtores rurais, empresas, obras, empreendimentos e pessoas que precisam entender, regularizar, licenciar ou planejar uma área com mais segurança."
      },
      {
        id: "when",
        question: "Quando vale buscar orientação?",
        answer: "A conversa inicial ajuda a organizar sua situação, entender o tipo de projeto e indicar o próximo passo mais adequado."
      },
      {
        id: "rural",
        question: "Vocês atendem áreas rurais e agricultura?",
        answer: "Sim. A Bioghaia oferece apoio técnico para propriedades rurais, lavouras, reflorestamento, manejo e análise de terreno."
      }
    ]
  },
  en: {
    assistant: {
      name: "Bia",
      role: "Bioghaia digital assistant",
      intro: "Hello! 👋 I'm Bia, Bioghaia's digital assistant. How can I help?",
      menuTitle: "How can I help today?",
      menuSubtitle: "Choose an option or write your message.",
      supportLabel: "Talk to the team",
      restartLabel: "Restart",
      backLabel: "Back",
      inputPlaceholder: "Write your message",
      submitLabel: "Send",
      summaryTitle: "Summary for the Bioghaia team",
      summaryIntro: "Ready. Here is an organized summary for the Bioghaia team.",
      consentPrompt: "May I forward these details to the Bioghaia team?",
      consentYes: "Yes, you can contact me",
      consentNo: "I prefer not to share my details",
      reviewTitle: "Review the summary",
      reviewIntro: "Check the information below. If it is correct, I can send it to WhatsApp.",
      reviewConfirm: "Confirm and continue",
      reviewEdit: "Correct information",
      reviewHuman: "Talk to the team",
      reviewMenu: "Back to the menu",
      successTitle: "Summary prepared",
      successBody: "The summary is ready to send on WhatsApp.",
      errorTitle: "Could not complete the request",
      errorBody: "I could not save the summary right now. You can copy the text below and send it by WhatsApp.",
      fallbackTitle: "I could not find a safe answer",
      fallbackBody: "I can help with Bioghaia services or prepare a contact message for the team.",
      humanTitle: "Forwarding to the team",
      humanBody: "I will organize your message for the Bioghaia team.",
      privacyTitle: "Privacy",
      privacyBody: "The information you share will only be used to understand your request and forward support.",
      menuConfirmTitle: "You already started a request",
      menuConfirmBody: "Would you like to keep your information or start again?",
      openWhatsApp: "Open WhatsApp",
      summaryReady: "Summary ready",
      summarySaved: "Summary saved",
      invalidInput: "I could not interpret that message safely. I can help with products, support, or the team.",
      clarificationTitle: "I want to make sure I understood correctly",
      clarificationBody: "Choose an option or type a short sentence to tell me what you need.",
      fallbackSimplerBody: "Let's keep it simple. Choose one of the options below.",
      fallbackHumanBody: "I can connect you with the Bioghaia team. Would you like to continue on WhatsApp?",
      consentDeclinedBody: "No problem. I will not store your details. You can still talk to the team on WhatsApp whenever you like.",
      describeIntro: "Tell me briefly what you need and I will organize the next steps.",
      editIntro: "What would you like to correct?",
      leadSavedStatus: "Request saved",
      whatsappPreparedStatus: "Summary prepared for WhatsApp",
      whatsappOpenedStatus: "WhatsApp opened",
      savingStatus: "Saving your request",
      resumeIntro: "Picking up where we left off.",
      whatsappGenericPrefill: "Hello! I came from the Bioghaia website and would like some initial guidance."
    },
    options: {
      products: "Explore our services",
      guided: "Find a relevant option",
      existing: "I am already a customer",
      purchase: "Request assistance",
      team: "Talk to the team",
      human: "Talk to the team",
      back: "Back",
      restart: "Restart",
      confirm: "Confirm and continue",
      edit: "Correct information",
      menu: "Back to the menu",
      anotherQuestion: "I have another question",
      anotherOption: "View another option",
      purchaseInfo: "I need this service",
      continue: "Continue",
      keepProgress: "Keep my information",
      startAgain: "Start again",
      continueRequest: "Continue my request",
      whatsapp: "WhatsApp",
      phone: "Phone",
      email: "Email",
      answerQuestion: "That answered my question",
      explainProducts: "I want to understand the services better",
      existingSupport: "I need support for an existing request",
      continueWhatsApp: "Continue on WhatsApp",
      individual: "Individual",
      company: "Company",
      publicOrganization: "Public organization",
      other: "Other",
      projectHelp: "I need help with a project",
      whatsappDirect: "Go to WhatsApp",
      assist: "I would like assistance",
      question: "I have a question",
      anotherService: "View another service",
      stageIdea: "Still an idea",
      stagePlanning: "In planning",
      stageOngoing: "Already in progress",
      deadlineNone: "No fixed deadline",
      editField: "Correct a field",
      addNote: "Add a note",
      skipNote: "Continue without a note"
    },
    services: [
      {
        id: "licenciamento",
        name: "Environmental Licensing and Regularization",
        description: "Technical support to understand requirements, organize documents, and move forward with clarity.",
        audience: "Properties, developments, construction projects, and activities that need initial guidance.",
        safeNote: "Bioghaia can guide you on the process and next step. It does not diagnose or guarantee outcomes."
      },
      {
        id: "topografia",
        name: "Surveying",
        description: "Technical surveys to support planning, documentation, and decision-making with precision.",
        audience: "Projects that need a technical base for land, construction, or property.",
        safeNote: "Bioghaia can explain the nature of the technical support. It does not replace a specific professional assessment."
      },
      {
        id: "geoprocessamento",
        name: "Geoprocessing",
        description: "Territorial analysis and mapping to understand land and regional characteristics.",
        audience: "Projects that need a technical reading of the territory.",
        safeNote: "Bioghaia can explain the use of territorial analysis. It does not replace a specific technical assessment."
      },
      {
        id: "diagnostico",
        name: "Environmental Assessment",
        description: "An initial review to understand requirements, risks, and next steps.",
        audience: "Cases that need an initial reading of the situation.",
        safeNote: "Bioghaia can help organize the handoff. It does not replace a specific technical assessment."
      },
      {
        id: "agricultura",
        name: "Agriculture and Reforestation",
        description: "Technical support for rural properties, management, CAR, and field planning.",
        audience: "Rural properties, crops, and reforestation projects.",
        safeNote: "Bioghaia can guide you on the initial support process. It does not replace a specific professional assessment."
      }
    ],
    intents: {
      main: "main menu",
      back: "back",
      restart: "restart",
      human: "person",
      products: "products",
      purchase: "buy",
      existing: "customer",
      contact: "contact",
      privacy: "privacy",
      cancel: "cancel"
    },
    fields: {
      name: "name",
      contact: "contact",
      contactMethod: "preferred contact",
      customerType: "customer type",
      city: "city",
      objective: "project need",
      projectStage: "project stage",
      deadline: "deadline",
      intent: "intent",
      service: "service or category",
      note: "note",
      consent: "consent",
      language: "language",
      source: "source"
    },
    prompts: {
      productsPrompt: "These are Bioghaia's services. Choose the one that makes the most sense for you.",
      guidedPrompt: "Tell me your situation briefly and I will point to the best service.",
      existingPrompt: "Are you already a customer? Tell me your case or choose an option.",
      purchasePrompt: "Great. I’ll collect a few details about your request.",
      teamPrompt: "Great. To speak with the team, please tell me your name.",
      namePrompt: "What is your name?",
      contactPrompt: "What is the best contact for follow-up?",
      contactMethodPrompt: "What is the best way for the team to contact you?",
      contactValuePrompt: "Share your WhatsApp number, phone, or email address.",
      customerTypePrompt: "To understand your request, are you contacting us as an individual or on behalf of an organization?",
      cityPrompt: "What city or state should we note?",
      objectivePrompt: "What is the main need of your project?",
      projectStagePrompt: "What stage is your project at?",
      deadlinePrompt: "Is there an important deadline? It is fine if there isn't.",
      describePrompt: "Tell me briefly what you need.",
      notePrompt: "Would you like to add a note for the team?",
      summaryPrompt: "I can review the summary before forwarding.",
      consentPrompt: "May I forward these details to the Bioghaia team?",
      clarificationPrompt: "Choose an option or type a short sentence to tell me what you need."
    },
    validation: {
      invalidEmail: "That email does not look valid. Could you check it?",
      invalidPhone: "That phone number does not look valid. Could you check it?",
      invalidContact: "I need a valid email or phone number for follow-up.",
      tooShort: "Could you give me a little more detail?"
    },
    faq: [
      {
        id: "who",
        question: "Who does Bioghaia work with?",
        answer: "Bioghaia works with landowners, rural producers, companies, construction projects, developments, and people who need to understand, regularize, permit, or plan an area with greater safety."
      },
      {
        id: "when",
        question: "When is it useful to seek guidance?",
        answer: "The initial conversation helps organize your situation, understand the type of project, and indicate the most appropriate next step."
      },
      {
        id: "rural",
        question: "Do you work with rural areas and agriculture?",
        answer: "Yes. Bioghaia offers technical support for rural properties, crops, reforestation, land management, and terrain analysis."
      }
    ]
  }
}
