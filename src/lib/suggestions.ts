import type { Signal, Technology } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mapea cada tecnología detectada a lo que Fast Dolphin realmente ofrece
// (extraído de fastdolphin.com) y a los argumentos de venta más relevantes
// para esa señal. Esto es lo que separa la herramienta de un CRM genérico:
// cada lead llega con el pitch ya armado para esa tecnología específica.
// ---------------------------------------------------------------------------
export const TECH_PITCH: Record<
  Technology,
  { servicio: string; argumentos: string[] }
> = {
  SAP: {
    servicio: "Consultores y desarrolladores SAP (S/4HANA, ABAP, Basis, funcionales)",
    argumentos: [
      "Perfiles bilingües con experiencia SAP evaluados en 24-48h",
      "Alineación horaria total con equipos de US/Canadá",
      "Costo significativamente menor que contratación doméstica en US",
    ],
  },
  Oracle: {
    servicio: "Consultores Oracle (DBA, ERP, middleware)",
    argumentos: [
      "Red ya vetada de especialistas Oracle en LatAm",
      "Opciones de staffing temporal, contract-to-hire o contratación directa",
      "Soporte de nómina y cumplimiento laboral local incluido",
    ],
  },
  Salesforce: {
    servicio: "Administradores y desarrolladores Salesforce",
    argumentos: [
      "Equipos dedicados nearshore para proyectos de integración Salesforce",
      "Entrega de shortlist en 24-48h",
      "20+ años de experiencia navegando particularidades legales/tributarias por país",
    ],
  },
  "Cloud/DevOps": {
    servicio: "Ingenieros Cloud y DevOps (AWS, Azure, GCP, SRE)",
    argumentos: [
      "Equipos nearshore dedicados para escalar infraestructura sin fricción de zona horaria",
      "Flexibilidad de moneda y términos de contratación",
      "Transparencia inmediata si un perfil muy nicho no está disponible en la región",
    ],
  },
  "Datos/IA": {
    servicio: "Data engineers y especialistas en ML/IA",
    argumentos: [
      "Talento LatAm especializado en ingeniería de datos y machine learning",
      "Rapidez de colocación frente a procesos de contratación domésticos más lentos",
      "Gestión de cuenta dedicada durante todo el proyecto",
    ],
  },
  Desarrollo: {
    servicio: "Desarrolladores full-stack, móvil y de software en general",
    argumentos: [
      "Más de 2,800 profesionales colocados, 420+ clientes en 21 países",
      "Modelos flexibles: temporal, contract-to-hire, contratación directa o equipo dedicado",
      "Candidatos evaluados y presentados en 24-48h",
    ],
  },
  QA: {
    servicio: "Ingenieros de QA y automatización de pruebas",
    argumentos: [
      "Cobertura rápida de vacantes de QA difíciles de cubrir localmente",
      "Soporte logístico de visado y reubicación si aplica",
      "Calidad sobre cantidad: no se envían candidatos solo por llenar el pipeline",
    ],
  },
  Ciberseguridad: {
    servicio: "Analistas y especialistas en ciberseguridad",
    argumentos: [
      "Acceso a perfiles especializados en seguridad difíciles de encontrar en US",
      "Cumplimiento y manejo de nómina local ya resuelto por Fast Dolphin",
      "20+ años de experiencia en colocación técnica especializada",
    ],
  },
  "PM/Consultoría": {
    servicio: "Project managers y consultores técnicos",
    argumentos: [
      "Perfiles bilingües listos para liderar equipos distribuidos",
      "Alineación horaria con las operaciones del cliente en US/Canadá",
      "Cuenta dedicada para coordinar el proceso de principio a fin",
    ],
  },
};

// Genera un borrador de mensaje de LinkedIn/email para una señal, listo para
// que una persona del equipo lo revise, edite y apruebe (nunca se envía solo).
export function generateOutreachDraft(signal: Signal, companyName: string) {
  const pitch = TECH_PITCH[signal.technology];
  const primerArgumento = pitch.argumentos[0];

  return [
    `Hola [Nombre] — vi que ${companyName} está buscando talento de ${signal.technology}` +
      (signal.signal_type === "vacante_publicada"
        ? " (vi la publicación reciente)."
        : "."),
    `En Fast Dolphin colocamos ${pitch.servicio.toLowerCase()} para empresas de US/Canadá, con equipos nearshore en LatAm. ${primerArgumento}.`,
    `¿Tienes 15 minutos esta semana para ver si podemos ayudarte a cubrir esta necesidad más rápido?`,
    ``,
    `Saludos,`,
    `[Tu nombre] · Fast Dolphin`,
  ].join("\n");
}

export function suggestionsForSignal(signal: Signal) {
  return TECH_PITCH[signal.technology];
}
