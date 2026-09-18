// Envío de correos vía Resend (https://resend.com) — capa gratis: 100
// correos/día, suficiente para avisar al equipo de señales de prioridad
// alta. Mientras no haya RESEND_API_KEY configurada, estas funciones
// simplemente no hacen nada: no rompe nada ni bloquea el resto de la app.
//
// Remitente: por defecto usa el dominio de pruebas de Resend
// (onboarding@resend.dev), que funciona sin configurar nada más. Para que
// los correos salgan como "@fastdolphin.com" hay que verificar ese dominio
// en Resend, lo cual requiere acceso al DNS de fastdolphin.com — normalmente
// no lo tiene un solo empleado, así que queda como mejora futura opcional
// (variable EMAIL_FROM).
import { listUsers } from "@/lib/queries";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Fast Dolphin Prospección <onboarding@resend.dev>";
const APP_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

export function isEmailConfigured() {
  return !!RESEND_API_KEY;
}

async function sendEmail(params: { to: string[]; subject: string; html: string }) {
  if (!RESEND_API_KEY || params.to.length === 0) {
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = (data && (data.message || data.error)) || `Resend respondió ${res.status}`;
      return { ok: false, error: String(message) };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido enviando correo.",
    };
  }
}

// Avisa a todo el equipo con cuenta en la plataforma que apareció una señal
// de prioridad alta (ya sea porque se cargó así manualmente, o porque
// alguien confirmó a mano que una vacante existe de verdad). Si el correo
// no está configurado (falta RESEND_API_KEY), no hace nada — es una
// funcionalidad opcional, no bloquea el resto del flujo.
export async function notifyTeamOfHighPrioritySignal(params: {
  signalId: string;
  companyName: string;
  technology: string;
  title: string;
  reason: "confirmada" | "cargada";
}) {
  if (!isEmailConfigured()) return;

  const users = await listUsers();
  const to = users.map((u) => u.email).filter(Boolean);
  if (to.length === 0) return;

  const url = `${APP_URL}/leads/${params.signalId}`;
  const reasonText =
    params.reason === "confirmada"
      ? "alguien del equipo verificó que la vacante existe de verdad"
      : "se cargó como prioridad alta";

  await sendEmail({
    to,
    subject: `Señal de prioridad alta: ${params.companyName} (${params.technology})`,
    html: `
      <div style="font-family: -apple-system, Arial, sans-serif; color: #24313B;">
        <p style="font-size:15px;">Nueva señal de <strong>prioridad alta</strong> en la plataforma de prospección — ${reasonText}.</p>
        <table style="font-size:14px; margin: 16px 0;">
          <tr><td style="color:#64748b; padding-right:12px;">Empresa</td><td><strong>${params.companyName}</strong></td></tr>
          <tr><td style="color:#64748b; padding-right:12px;">Tecnología</td><td>${params.technology}</td></tr>
          <tr><td style="color:#64748b; padding-right:12px;">Señal</td><td>${params.title}</td></tr>
        </table>
        <a href="${url}" style="display:inline-block; background:#E71925; color:#fff; padding:10px 18px; border-radius:10px; text-decoration:none; font-weight:600;">Ver en la plataforma</a>
      </div>
    `,
  });
}
