import { NextResponse } from "next/server";
import { getDb, getOrCreateUser } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = await getDb();
  const user = await getOrCreateUser(db);
  const gens = db.data.generations
    .filter((g) => g.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);
  return NextResponse.json({ items: gens });
}




