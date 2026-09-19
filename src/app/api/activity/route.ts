import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listRecentActivity, type RecentActivityFilter } from "@/lib/queries";

const VALID_KINDS: NonNullable<RecentActivityFilter["kind"]>[] = [
  "note",
  "status",
  "created",
  "contact",
];
const VALID_RANGES: NonNullable<RecentActivityFilter["range"]>[] = ["today", "7d", "30d", "all"];

function asKind(value: string | null): RecentActivityFilter["kind"] {
  return (VALID_KINDS as string[]).includes(value ?? "")
    ? (value as RecentActivityFilter["kind"])
    : undefined;
}

function asRange(value: string | null): RecentActivityFilter["range"] {
  return (VALID_RANGES as string[]).includes(value ?? "")
    ? (value as RecentActivityFilter["range"])
    : "today";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = asKind(searchParams.get("kind"));
  const range = asRange(searchParams.get("range"));

  const items = await listRecentActivity({ kind, range, limit: 12 });
  return NextResponse.json({ items });
}
