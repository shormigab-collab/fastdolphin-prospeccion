import { sql } from "@/lib/db";
import type {
  Signal,
  MessageDraft,
  Note,
  SignalStatus,
  SignalPriority,
  SignalSource,
  SignalType,
  Technology,
  WorkMode,
} from "@/lib/types";

export async function listSignals(filter?: {
  status?: SignalStatus;
  technology?: Technology;
  priority?: SignalPriority;
  // Una o varias fuentes a la vez (por ejemplo Apollo + Adzuna) — un array
  // vacío o undefined significa "todas las fuentes", sin filtrar.
  sources?: SignalSource[];
  workMode?: WorkMode;
  // Busca por coincidencia parcial en el título de la señal o el nombre de
  // la empresa (case-insensitive) — filtro de texto libre para el buscador.
  q?: string;
  // Responsable asignado — un id de usuario real, o el string especial
  // "unassigned" para "Sin asignar" (no se puede pasar null por querystring).
  assignedTo?: string;
  // Solo señales cuyo seguimiento programado (next_follow_up_at) ya venció
  // (es antes de hoy) — para la pestaña rápida "Seguimiento vencido".
  overdueOnly?: boolean;
}) {
  const searchTerm = filter?.q?.trim() ? `%${filter.q.trim()}%` : null;
  const assignedToId =
    filter?.assignedTo && filter.assignedTo !== "unassigned" ? filter.assignedTo : null;
  const onlyUnassigned = filter?.assignedTo === "unassigned";
  const sourceList = filter?.sources && filter.sources.length > 0 ? filter.sources : null;

  const rows = (await sql`
    select
      s.*,
      json_build_object(
        'id', c.id, 'name', c.name, 'domain', c.domain, 'industry', c.industry,
        'size_range', c.size_range, 'linkedin_url', c.linkedin_url,
        'careers_url', c.careers_url, 'notes', c.notes, 'created_at', c.created_at
      ) as company,
      case when u.id is null then null else
        json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email)
      end as assigned_user
    from signals s
    join companies c on c.id = s.company_id
    left join users u on u.id = s.assigned_to
    where (${filter?.status ?? null}::text is null or s.status = ${filter?.status ?? null})
      and (${filter?.technology ?? null}::text is null or s.technology = ${filter?.technology ?? null})
      and (${filter?.priority ?? null}::text is null or s.priority = ${filter?.priority ?? null})
      and (${sourceList}::text[] is null or s.source = any(${sourceList}::text[]))
      and (${filter?.workMode ?? null}::text is null or s.work_mode = ${filter?.workMode ?? null})
      and (${assignedToId}::uuid is null or s.assigned_to = ${assignedToId}::uuid)
      and (${onlyUnassigned} = false or s.assigned_to is null)
      and (${filter?.overdueOnly ?? false} = false or s.next_follow_up_at < current_date)
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

// Evita crear dos veces la misma vacante real de Adzuna si el equipo
// sincroniza varias veces — a diferencia de Apollo (que dedupe por
// empresa+tecnología, porque solo hay una señal de "perfil coincide" por
// empresa), acá cada vacante real tiene su propio link, así que ese link
// es la forma correcta de reconocer un duplicado.
export async function findSignalBySourceUrl(sourceUrl: string) {
  const rows = (await sql`
    select id from signals where source_url = ${sourceUrl} limit 1
  `) as unknown as { id: string }[];

  return rows[0]?.id ?? null;
}

// Igual que countApolloSignalsForTechnology, pero genérica para cualquier
// fuente de "vacante real" (Adzuna, RemoteOK, Remotive) — cuántas señales
// de esa fuente ya existen para esta tecnología, para calcular qué
// "página" de resultados pedir en la próxima sincronización.
export async function countSignalsForTechnologyBySource(
  technology: Technology,
  source: SignalSource
) {
  const rows = (await sql`
    select count(*)::int as count from signals
    where technology = ${technology} and source = ${source}
  `) as unknown as { count: number }[];

  return rows[0]?.count ?? 0;
}

// Crea una señal a partir de una vacante real encontrada en una bolsa de
// empleo externa (Adzuna, RemoteOK, Remotive). A diferencia de Apollo (que
// solo compara perfil y entra en prioridad media), esto es una vacante
// publicada de verdad hoy — con link directo a la publicación — así que
// entra ya confirmada, en prioridad alta.
export async function createJobFeedSignal(params: {
  source: SignalSource;
  companyId: string;
  title: string;
  technology: Technology;
  sourceUrl: string;
  location?: string | null;
  workMode: WorkMode;
}) {
  const rows = (await sql`
    insert into signals (
      company_id, title, technology, signal_type, priority, source,
      source_url, status, work_mode, location, vacancy_confirmed_at
    )
    values (
      ${params.companyId}, ${params.title}, ${params.technology}, 'vacante_publicada',
      'alta', ${params.source}, ${params.sourceUrl}, 'nuevo', ${params.workMode},
      ${params.location ?? null}, now()
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

// Carga a mano el contacto de una señal (nombre, cargo, correo, teléfono,
// LinkedIn) — para cuando el equipo lo encuentra por su cuenta en LinkedIn
// u otra fuente, sin depender de que Apollo lo tenga. No toca
// `contact_looked_up_at` ni `contact_apollo_id`: esos campos siguen
// reflejando si (y cuándo) hubo una búsqueda real en Apollo, para no
// mezclar ambas fuentes.
export async function updateSignalContact(
  signalId: string,
  contact: {
    name: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
  }
) {
  await sql`
    update signals set
      contact_name = ${contact.name},
      contact_title = ${contact.title},
      contact_email = ${contact.email},
      contact_phone = ${contact.phone},
      contact_linkedin_url = ${contact.linkedinUrl}
    where id = ${signalId}
  `;
}

// Borra la señal por completo. Sus mensajes y notas se borran solos en
// cascada (ver "on delete cascade" en db/0001_init.sql) — no hace falta
// borrarlos aparte. Es una acción destructiva sin deshacer, por eso la
// confirmación real vive en el cliente (DeleteSignalButton) antes de
// llamar a esto.
export async function deleteSignal(signalId: string) {
  await sql`delete from signals where id = ${signalId}`;
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
  kind: "note" | "status" | "created" | "contact";
  at: string;
  signal_id: string;
  signal_title: string;
  company_name: string;
  company_domain: string | null;
  technology: Technology;
  source: SignalSource;
  status: SignalStatus;
  note_body: string | null;
  contact_name: string | null;
  author_name: string | null;
}

export interface RecentActivityFilter {
  // undefined = todas las pestañas ("Todas")
  kind?: "note" | "status" | "created" | "contact";
  // undefined/"all" = sin límite de fecha
  range?: "today" | "7d" | "30d" | "all";
  limit?: number;
}

// Actividad reciente real (no inventada): combina notas agregadas, cambios
// de estado (detectados por updated_at != created_at), señales nuevas y
// búsquedas de contacto exitosas (detectadas por contact_looked_up_at). Se
// usa en el resumen/dashboard, con filtros de pestaña ("Señales" /
// "Contactos" / "Seguimientos") y de rango de fecha.
export async function listRecentActivity(filter?: RecentActivityFilter) {
  const limit = filter?.limit ?? 12;
  const rangeInterval =
    filter?.range === "today"
      ? "1 day"
      : filter?.range === "7d"
        ? "7 days"
        : filter?.range === "30d"
          ? "30 days"
          : null;

  const rows = (await sql`
    select * from (
      (
        select 'note' as kind, n.created_at as at, s.id as signal_id, s.title as signal_title,
          c.name as company_name, c.domain as company_domain, s.technology as technology,
          s.source as source, s.status as status, n.body as note_body,
          null as contact_name, u.full_name as author_name
        from notes n
        join signals s on s.id = n.signal_id
        join companies c on c.id = s.company_id
        left join users u on u.id = n.author_id
      )
      union all
      (
        select 'status' as kind, s.updated_at as at, s.id as signal_id, s.title as signal_title,
          c.name as company_name, c.domain as company_domain, s.technology as technology,
          s.source as source, s.status as status, null as note_body,
          null as contact_name, null as author_name
        from signals s
        join companies c on c.id = s.company_id
        where s.updated_at <> s.created_at
      )
      union all
      (
        select 'created' as kind, s.created_at as at, s.id as signal_id, s.title as signal_title,
          c.name as company_name, c.domain as company_domain, s.technology as technology,
          s.source as source, s.status as status, null as note_body,
          null as contact_name, null as author_name
        from signals s
        join companies c on c.id = s.company_id
      )
      union all
      (
        select 'contact' as kind, s.contact_looked_up_at as at, s.id as signal_id, s.title as signal_title,
          c.name as company_name, c.domain as company_domain, s.technology as technology,
          s.source as source, s.status as status, null as note_body,
          s.contact_name as contact_name, null as author_name
        from signals s
        join companies c on c.id = s.company_id
        where s.contact_looked_up_at is not null
      )
    ) activity
    where (${filter?.kind ?? null}::text is null or kind = ${filter?.kind ?? null})
      and (
        ${rangeInterval}::text is null
        or at >= now() - (${rangeInterval})::interval
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

// Señales con seguimiento programado (next_follow_up_at) que ya venció o
// es hoy — alimenta el panel "Pendientes de hoy" de Actividad con fechas
// reales, nunca inventadas. Vencidas primero.
export async function listPendingFollowUps(limit = 20) {
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
    where s.next_follow_up_at is not null and s.next_follow_up_at <= current_date
    order by s.next_follow_up_at asc
    limit ${limit}
  `) as unknown as Signal[];

  return rows;
}

export async function listUsers() {
  return (await sql`
    select id, email, full_name, role, created_at from users order by created_at asc
  `) as unknown as { id: string; email: string; full_name: string | null; role: string; created_at: string }[];
}

// ---------------------------------------------------------------------------
// Acciones en lote (barra de selección de /leads) — operan sobre varias
// señales a la vez, seleccionadas por checkbox. `userId` puede venir null
// para "Sin asignar" en la asignación en lote.
// ---------------------------------------------------------------------------

export async function bulkAssignSignals(signalIds: string[], userId: string | null) {
  if (signalIds.length === 0) return;
  await sql`
    update signals set assigned_to = ${userId}, updated_at = now()
    where id = any(${signalIds}::uuid[])
  `;
}

export async function bulkUpdateStatus(signalIds: string[], status: SignalStatus) {
  if (signalIds.length === 0) return;
  await sql`
    update signals set status = ${status}, updated_at = now()
    where id = any(${signalIds}::uuid[])
  `;
}

// Programa (o borra, si date es null) la fecha del próximo seguimiento para
// varias señales a la vez — es lo que alimenta "Seguimiento vencido" y el
// panel de "Pendientes de hoy" en Actividad, con datos reales en vez de
// inventados.
export async function bulkScheduleFollowUp(
  signalIds: string[],
  date: string | null,
  note?: string | null
) {
  if (signalIds.length === 0) return;
  await sql`
    update signals
    set next_follow_up_at = ${date}, next_follow_up_note = ${note ?? null}, updated_at = now()
    where id = any(${signalIds}::uuid[])
  `;
}
