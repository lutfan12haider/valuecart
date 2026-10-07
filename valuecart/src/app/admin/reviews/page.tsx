import { db } from "@/lib/db";
import ReviewModerator from "./ReviewModerator";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({ searchParams }: { searchParams: { pending?: string } }) {
  const pendingOnly = searchParams.pending === "1";

  const reviews = await db.review.findMany({
    where: pendingOnly ? { approved: false } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } }
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <a
          href={pendingOnly ? "/admin/reviews" : "/admin/reviews?pending=1"}
          className="text-sm text-brand"
        >
          {pendingOnly ? "Show all" : "Pending only"}
        </a>
      </div>
      <ReviewModerator reviews={reviews} />
    </div>
  );
}
