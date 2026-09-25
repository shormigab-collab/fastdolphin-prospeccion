import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const { fullName, email: rawEmail, password } = await request.json();

  const email = String(rawEmail ?? "").trim().toLowerCase();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Correo o contraseña inválidos (mínimo 8 caracteres)." },
      { status: 400 }
    );
  }

  const domain = email.split("@")[1];

  // Esta es la validación real (la del formulario es solo para feedback
  // inmediato): si el dominio no está en allowed_domains, no se crea la
  // cuenta, sin importar qué mande el cliente.
  const allowed = (await sql`
    select 1 from allowed_domains where domain = ${domain} limit 1
  `) as unknown as unknown[];

  if (allowed.length === 0) {
    return NextResponse.json(
      { error: `Solo se pueden crear cuentas con correo de dominios autorizados (ej. fastdolphin.com).` },
      { status: 403 }
    );
  }

  const existing = (await sql`
    select 1 from users where email = ${email} limit 1
  `) as unknown as unknown[];

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await sql`
    insert into users (email, password_hash, full_name)
    values (${email}, ${passwordHash}, ${fullName ?? email})
  `;

  return NextResponse.json({ ok: true });
}
