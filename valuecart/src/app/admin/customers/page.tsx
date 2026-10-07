import { db } from "@/lib/db";
import CustomerList from "./CustomerList";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();

  const customers = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q && {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } }
        ]
      })
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      disabled: true,
      createdAt: true,
      _count: { select: { orders: true } }
    }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or email"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="btn">Search</button>
      </form>
      <CustomerList customers={customers} />
    </div>
  );
}
