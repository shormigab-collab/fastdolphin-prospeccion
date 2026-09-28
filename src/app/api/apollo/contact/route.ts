import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findCompanyContactCandidates, revealContact, isApolloConnected } from "@/lib/apollo";
import { getSignalById, saveContactForSignal } from "@/lib/queries";

// Dos acciones en la misma ruta, según body.action:
//   - "search" (por defecto si no se manda action, para no romper nada que
//     ya la llamara): trae hasta varios candidatos con cargos de RRHH/
//     Talent Acquisition/Recruiting — no gasta crédito de Apollo, no guarda
//     nada todavía. El equipo elige a la persona correcta en la interfaz.
//   - "reveal": ya con un apolloId elegido, revela el correo (consume 1
//     crédito) y recién ahí guarda el contacto en la señal.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!isApolloConnected()) {
    return NextResponse.json(
      { error: "Falta configurar APOLLO_API_KEY en las variables de entorno de Vercel." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const signalId = body?.signalId as string | undefined;
  const action = body?.action === "reveal" ? "reveal" : "search";

  if (!signalId) {
    return NextResponse.json({ error: "Falta el id de la señal." }, { status: 400 });
  }

  const signal = await getSignalById(signalId);
  if (!signal) {
    return NextResponse.json({ error: "Señal no encontrada." }, { status: 404 });
  }

  if (action === "search") {
    const { candidates, error } = await findCompanyContactCandidates({
      companyName: signal.company?.name ?? "",
      companyDomain: signal.company?.domain ?? null,
    });

    if (error && candidates.length === 0) {
      return NextResponse.json({ error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, candidates });
  }

  // action === "reveal"
  const apolloId = body?.apolloId as string | undefined;
  if (!apolloId) {
    return NextResponse.json({ error: "Falta el id de Apollo del contacto elegido." }, { status: 400 });
  }

  const { contact, error } = await revealContact({
    apolloId,
    fallbackName: (body?.name as string | undefined) ?? null,
    fallbackTitle: (body?.title as string | undefined) ?? null,
    fallbackLinkedinUrl: (body?.linkedinUrl as string | undefined) ?? null,
  });

  if (error && !contact) {
    return NextResponse.json({ error }, { status: 502 });
  }

  if (!contact) {
    return NextResponse.json({ ok: true, found: false });
  }

  await saveContactForSignal(signalId, {
    name: contact.name,
    title: contact.title,
    email: contact.email,
    emailStatus: contact.emailStatus,
    phone: contact.phone,
    linkedinUrl: contact.linkedinUrl,
    apolloId: contact.apolloId,
  });

  // Error suave: se reveló lo que se pudo pero algo falló (por ejemplo, el
  // correo no se pudo revelar) — igual se guarda lo que sí hay.
  return NextResponse.json({
    ok: true,
    found: true,
    contact,
    warning: error ?? null,
  });
}
