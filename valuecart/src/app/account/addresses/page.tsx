import { redirect } from "next/navigation";
import AddressManager from "@/components/AddressManager";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/addresses");

  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Saved addresses</h1>
      <AddressManager initial={addresses} />
    </div>
  );
}
