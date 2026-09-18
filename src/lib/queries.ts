import { sql } from "@/lib/db";
import type {
  Signal,
  MessageDraft,
  Note,
  SignalStatus,
  SignalPriority,
  SignalType,
  Technology,
} from "@/lib/types";

export async function listSignals(filter?: {
  status?: SignalStatus;
  technology?: Technology;
}) {
  const rows = (await sql`
    select
      s.*,
      json_build_object(
        'id', c.id, 'name', c.name, 'domain', c.domain, 'industry', c.industry,
        'size_range', c.size_range, 'linkedin_url', c.linkedin_url,
        'notes', c.notes, 'created_at', c.created_at
      ) as company
    from signals s
    join companies c on c.id = s.company_id
    where (${filter?.status ?? null}::text is null or s.status = ${filter?.status ?? null})
      and (${filter?.technology ?? null}::text is null or s.technology = ${filter?.technology ?? null})
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
        'notes', c.notes, 'created_at', c.created_at
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
  sourceUrl?: string | null;
  rawText?: string | null;
  createdBy?: string | null;
}) {
  const rows = (await sql`
    insert into signals (
      company_id, title, technology, signal_type, priority, source,
      source_url, raw_text, status, created_by
    )
    values (
      ${params.companyId}, ${params.title}, ${params.technology}, ${params.signalType},
      ${params.priority}, 'linkedin_import', ${params.sourceUrl ?? null},
      ${params.rawText ?? null}, 'nuevo', ${params.createdBy ?? null}
    )
    returning id
  `) as unknown as { id: string }[];

  return rows[0].id;
}

export async function updateSignalStatus(signalId: string, status: SignalStatus) {
  await sql`update signals set status = ${status} where id = ${signalId}`;
}

export async function insertMessageDraft(params: { signalId: string; draftText: string }) {
  await sql`
    insert into messages (signal_id, channel, draft_text, status, suggested_by)
    values (${params.signalId}, 'linkedin', ${params.draftText}, 'pendiente_aprobacion', 'system')
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

export async function listUsers() {
  return (await sql`
    select id, email, full_name, role, created_at from users order by created_at asc
  `) as unknown as { id: string; email: string; full_name: string | null; role: string; created_at: string }[];
}
