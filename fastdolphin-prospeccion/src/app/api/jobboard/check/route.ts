import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkJobBoard } from "@/lib/jobBoards";
import { getSignalById } from "@/lib/queries";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
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

  const careersUrl = signal.company?.careers_url;
  if (!careersUrl) {
    return NextResponse.json(
      { error: "Esta empresa todavía no tiene guardado el link de su bolsa de empleo." },
      { status: 400 }
    );
  }

  const result = await checkJobBoard(careersUrl, signal.technology);
  return NextResponse.json(result);
}
