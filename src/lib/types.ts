export type Technology =
  | "SAP"
  | "Oracle"
  | "Salesforce"
  | "Cloud/DevOps"
  | "Datos/IA"
  | "Desarrollo"
  | "QA"
  | "Ciberseguridad"
  | "PM/Consultoría";

export type SignalStatus =
  | "nuevo"
  | "calificando"
  | "contactado"
  | "en_conversacion"
  | "reunion_agendada"
  | "ganado"
  | "descartado";

export type SignalPriority = "alta" | "media" | "baja";

export type SignalSource = "apollo" | "manual" | "linkedin_import";

export type WorkMode = "remoto" | "hibrido" | "presencial";

export type SignalType =
  | "vacante_publicada"
  | "contratacion_reciente"
  | "expansion"
  | "tecnologia_detectada"
  | "otro";

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size_range: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Signal {
  id: string;
  company_id: string;
  title: string;
  technology: Technology;
  signal_type: SignalType;
  source: SignalSource;
  source_url: string | null;
  raw_text: string | null;
  status: SignalStatus;
  priority: SignalPriority;
  work_mode: WorkMode;
  location: string | null;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_linkedin_url: string | null;
  contact_apollo_id: string | null;
  contact_email_status: string | null;
  contact_looked_up_at: string | null;
  vacancy_confirmed_at: string | null;
  vacancy_confirmed_by: string | null;
  assigned_to: string | null;
  detected_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface MessageDraft {
  id: string;
  signal_id: string;
  channel: "linkedin" | "email";
  subject: string | null;
  draft_text: string;
  status: "pendiente_aprobacion" | "aprobado" | "enviado" | "descartado";
  suggested_by: "system" | "user";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  signal_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}
