import { sql } from "@/lib/db";
import type {
  Signal,
  MessageDraft,
  Note,
  SignalStatus,
  SignalPriority,
  SignalType,
  Technology,
  WorkMode,
} from "@/lib/types";

export async function listSignals(filter?: {
  status?: SignalStatus;
  technology?: Technology;
  priority?: SignalPriority;
  // Busca por coincidencia parcial en el título de la señal o el nombre de
  // la empresa (case-insensitive) — filtro de texto libre para el buscador.
  q?: string;
}) {
  const searchTerm = filter?.q?.trim() ? `%${filter.q.trim()}%` : null;

  const rows = (await sql`
    select
      s.*,
      json_build_object(
        'id', c.id, 'name', c.name, 'domain', c.domain, 'industry', c.industry,
        'size_range', c.size_range, 'linkedin_url', c.linkedin_url,
        'careers_url', c.careers_url, 'notes', c.notes, 'created_at', c.created_at
      ) as company
    from signals s
    join companies c on c.id = s.company_id
    where (${filter?.status ?? null}::text is null or s.status = ${filter?.status ?? null})
      and (${filter?.technology ?? null}::text is null or s.technology = ${filter?.technology ?? null})
      and (${filter?.priority ?? null}::text is null or s.priority = ${filter?.priority ?? null})
      and (
        ${searchTerm}::text is null
        or s.title ilike ${searchTerm}
        or c.name ilike ${searchTerm}
      )
    order by
      case s.priority when 'alta' then 0 when 'media' then 1 else 2 end,
      s.detected_at desc
  `) as unknown as Signal[];

  return rows;
}

export async function getSignalById(id: string) {
  const rows = (await sql`
    select
      s.*,
      json_build_object(
        'id', c.id, 'name', c.name, 'domain', c.domain, 'industry', c.industry,
        'size_range', c.size_range, 'linkedin_url', c.linkedin_url,
        'careers_url', c.careers_url, 'notes', c.notes, 'created_at', c.created_at
      ) as company
    from signals s
    join companies c on c.id = s.company_id
    where s.id = ${id}
    limit 1
  `) as unknown as Signal[];

  return rows[0] ?? null;
}

export async function messagesForSignal(signalId: string) {
  return (await sql`
    select * from messages where signal_id = ${signalId} order by created_at desc
  `) as unknown as MessageDraft[];
}

export async function notesForSignal(signalId: string) {
  return (await sql`
    select * from notes where signal_id = ${signalId} order by created_at desc
  `) as unknown as Note[];
}

export async function findOrCreateCompany(params: {
  name: string;
  domain?: string | null;
  linkedin_url?: string | null;
}) {
  const existing = (await sql`
    select id from companies where name = ${params.name} limit 1
  `) as unknown as { id: string }[];

  if (existing[0]) return existing[0].id;

  const created = (await sql`
    insert into companies (name, domain, linkedin_url)
    values (${params.name}, ${params.domain ?? null}, ${params.linkedin_url ?? null})
    returning id
  `) as unknown as { id: string }[];

  return created[0].id;
}

export async function createManualSignal(params: {
  companyId: string;
  title: string;
  technology: Technology;
  signalType: SignalType;
  priority: SignalPriority;
  workMode: WorkMode;
  location?: string | null;
  sourceUrl?: string | null;
  rawText?: string | null;
  createdBy?: string | null;
  // De dónde salió (LinkedIn, Indeed, Computrabajo, página de la empresa,
  // etc.) — internamente sigue guardándose como source='linkedin_import'
  // por compatibilidad con la restricción de la base de datos, pero este
  // campo aparte guarda de dónde salió de verdad para mostrarlo bien.
  originLabel?: string | null;
}) {
  const rows = (await sql`
    insert into signals (
      company_id, title, technology, signal_type, priority, source,
      source_url, raw_text, status, created_by, work_mode, location, origin_label
    )
    values (
      ${params.companyId}, ${params.title}, ${params.technology}, ${params.signalType},
      ${params.priority}, 'linkedin_import', ${params.sourceUrl ?? null},
      ${params.rawText ?? null}, 'nuevo', ${params.createdBy ?? null},
      ${params.workMode}, ${params.location ?? null}, ${params.originLabel ?? null}
    )
    returning id
  `) as unknown as { id: string }[];

  return rows[0].id;
}

// Guarda el link de la bolsa de empleo pública de la empresa (Greenhouse,
// Lever, etc.) para poder revisar automáticamente si tienen vacantes
// abiertas — se usa desde el detalle de cualquier señal de esa empresa.
export async function updateCompanyCareersUrl(companyId: string, careersUrl: string) {
  await sql`
    update companies set careers_url = ${careersUrl} where id = ${companyId}
  `;
}

// Cuántas señales de Apollo ya existen para esta tecnología — se usa para
// calcular qué "página" de resultados de Apollo pedir en la próxima
// sincronización, así cada sync avanza más profundo en sus resultados en
// vez de pedir siempre las mismas primeras empresas.
export async function countApolloSignalsForTechnology(technology: Technology) {
  const rows = (await sql`
    select count(*)::int as count from signals
    where technology = ${technology} and source = 'apollo'
  `) as unknown as { count: number }[];

  return rows[0]?.count ?? 0;
}

// Evita crear la misma señal de Apollo.io dos veces si el equipo sincroniza
// varias veces (una empresa + tecnología ya detectada antes no se repite).
export async function findApolloSignalForCompany(companyId: string, technology: Technology) {
  const rows = (await sql`
    select id from signals
    where company_id = ${companyId} and technology = ${technology} and source = 'apollo'
    limit 1
  `) as unknown as { id: string }[];

  return rows[0]?.id ?? null;
}

export async function createApolloSignal(params: {
  companyId: string;
  title: string;
  technology: Technology;
  sourceUrl?: string | null;
  rawText?: string | null;
  workMode?: WorkMode;
  location?: string | null;
}) {
  const rows = (await sql`
    insert into signals (
      company_id, title, technology, signal_type, priority, source,
      source_url, raw_text, status, work_mode, location
    )
    values (
      ${params.companyId}, ${params.title}, ${params.technology}, 'tecnologia_detectada',
      'media', 'apollo', ${params.sourceUrl ?? null}, ${params.rawText ?? null}, 'nuevo',
      ${params.workMode ?? "remoto"}, ${params.location ?? null}
    )
    returning id
  `) as unknown as { id: string }[];

  return rows[0].id;
}

export async function saveContactForSignal(
  signalId: string,
  contact: {
    name: string;
    title?: string | null;
    email?: string | null;
    emailStatus?: string | null;
    phone?: string | null;
    linkedinUrl?: string | null;
    apolloId?: string | null;
  }
) {
  await sql`
    update signals
    set contact_name = ${contact.name},
        contact_title = ${contact.title ?? null},
        contact_email = ${contact.email ?? null},
        contact_email_status = ${contact.emailStatus ?? null},
        contact_phone = ${contact.phone ?? null},
        contact_linkedin_url = ${contact.linkedinUrl ?? null},
        contact_apollo_id = ${contact.apolloId ?? null},
        contact_looked_up_at = now()
    where id = ${signalId}
  `;
}

export async function updateSignalStatus(signalId: string, status: SignalStatus) {
  await sql`update signals set status = ${status} where id = ${signalId}`;
}

export async function insertMessageDraft(params: {
  signalId: string;
  draftText: string;
  channel?: "linkedin" | "email";
  subject?: string | null;
}) {
  await sql`
    insert into messages (signal_id, channel, subject, draft_text, status, suggested_by)
    values (
      ${params.signalId}, ${params.channel ?? "linkedin"}, ${params.subject ?? null},
      ${params.draftText}, 'pendiente_aprobacion', 'system'
    )
  `;
}

export async function updateMessageDraft(
  messageId: string,
  params: { draftText: string; subject?: string | null }
) {
  await sql`
    update messages
    set draft_text = ${params.draftText}, subject = ${params.subject ?? null}
    where id = ${messageId}
  `;
}

export async function approveMessage(messageId: string, userId: string | null) {
  await sql`
    update messages
    set status = 'aprobado', approved_by = ${userId}, approved_at = now()
    where id = ${messageId}
  `;
}

export async function markMessageSent(messageId: string, signalId: string) {
  await sql`update messages set status = 'enviado' where id = ${messageId}`;
  await sql`update signals set status = 'contactado' where id = ${signalId}`;
}

export async function discardMessage(messageId: string) {
  await sql`update messages set status = 'descartado' where id = ${messageId}`;
}

export async function addNote(params: { signalId: string; authorId: string | null; body: string }) {
  await sql`
    insert into notes (signal_id, author_id, body)
    values (${params.signalId}, ${params.authorId}, ${params.body})
  `;
}

export interface RecentActivityItem {
  kind: "note" | "status" | "created";
  at: string;
  signal_id: string;
  signal_title: string;
  company_name: string;
  status: SignalStatus;
  note_body: string | null;
  author_name: string | null;
}

// Actividad reciente real (no inventada): combina notas agregadas, cambios
// de estado (detectados por updated_at != created_at) y señales nuevas.
// Se usa en el resumen/dashboard.
export async function listRecentActivity(limit = 6) {
  const rows = (await sql`
    (
      select 'note' as kind, n.created_at as at, s.id as signal_id, s.title as signal_title,
        c.name as company_name, s.status as status, n.body as note_body,
        u.full_name as author_name
      from notes n
      join signals s on s.id = n.signal_id
      join companies c on c.id = s.company_id
      left join users u on u.id = n.author_id
      order by n.created_at desc
      limit ${limit}
    )
    union all
    (
      select 'status' as kind, s.updated_at as at, s.id as signal_id, s.title as signal_title,
        c.name as company_name, s.status as status, null as note_body,
        null as author_name
      from signals s
      join companies c on c.id = s.company_id
      where s.updated_at <> s.created_at
      order by s.updated_at desc
      limit ${limit}
    )
    union all
    (
      select 'created' as kind, s.created_at as at, s.id as signal_id, s.title as signal_title,
        c.name as company_name, s.status as status, null as note_body,
        null as author_name
      from signals s
      join companies c on c.id = s.company_id
      order by s.created_at desc
      limit ${limit}
    )
    order by at desc
    limit ${limit}
  `) as unknown as RecentActivityItem[];

  return rows;
}

// Marca una señal como "vacante confirmada" a mano — alguien del equipo
// verificó que la vacante existe de verdad, así que sube la prioridad a
// alta (no lo hace ningún proceso automático, porque el plan de Apollo.io
// que usamos no confirma vacantes activas, solo perfiles que coinciden).
export async function confirmVacancy(signalId: string, userId: string | null) {
  await sql`
    update signals
    set priority = 'alta', vacancy_confirmed_at = now(), vacancy_confirmed_by = ${userId}
    where id = ${signalId}
  `;
}

export async function listUsers() {
  return (await sql`
    select id, email, full_name, role, created_at from users order by created_at asc
  `) as unknown as { id: string; email: string; full_name: string | null; role: string; created_at: string }[];
}
