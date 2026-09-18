import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findCompanyContact, isApolloConnected } from "@/lib/apollo";
import { getSignalById, saveContactForSignal } from "@/lib/queries";

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

  if (!signalId) {
    return NextResponse.json({ error: "Falta el id de la señal." }, { status: 400 });
  }

  const signal = await getSignalById(signalId);
  if (!signal) {
    return NextResponse.json({ error: "Señal no encontrada." }, { status: 404 });
  }

  const { contact, error } = await findCompanyContact({
    companyName: signal.company?.name ?? "",
    companyDomain: signal.company?.domain ?? null,
  });

  // Error duro: ni siquiera se pudo buscar (key inválida, endpoint fuera del
  // plan, etc.) — no hay nada que guardar.
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

  // Error suave: se encontró a la persona pero falló la revelación de correo
  // (por ejemplo, el plan no la incluye) — igual guardamos lo que sí hay.
  return NextResponse.json({
    ok: true,
    found: true,
    contact,
    warning: error ?? null,
  });
}
