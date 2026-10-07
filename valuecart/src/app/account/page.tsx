import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import ProfileEditor from "./ProfileEditor";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getUser();
  if (!session) redirect("/login?next=/account");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, phone: true, createdAt: true }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">My account</h1>
      <div className="card space-y-2 p-5">
        <p><span className="font-medium">Name:</span> {user?.name}</p>
        <p><span className="font-medium">Email:</span> {user?.email}</p>
        <p><span className="font-medium">Phone:</span> {user?.phone ?? "—"}</p>
        <ProfileEditor name={user?.name ?? ""} phone={user?.phone ?? null} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/account/orders" className="card p-4 font-medium hover:border-brand">
          Order history
        </Link>
        <Link href="/account/addresses" className="card p-4 font-medium hover:border-brand">
          Addresses
        </Link>
      </div>
      <LogoutButton />
    </div>
  );
}
