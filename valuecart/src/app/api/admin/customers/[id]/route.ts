import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ disabled: z.boolean() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  // Prevent admins from disabling themselves
  if (params.id === admin.id) {
    return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: { disabled: parsed.data.disabled },
    select: { id: true, disabled: true }
  });
  return NextResponse.json({ user });
}
