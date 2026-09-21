import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";

// Todo lo de acá adentro depende de la sesión y de datos en vivo de la base
// de datos (Neon), así que nunca debe pre-renderizarse en build time.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar email={session.user.email ?? ""} fullName={session.user.name} />
      <div className="flex-1 overflow-y-auto bg-canvas">{children}</div>
    </div>
  );
}
