import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/orders";

const schema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(30),
  shipFullName: z.string().trim().min(2).max(120),
  shipCountry: z.string().trim().min(2).max(80),
  shipState: z.string().trim().max(80).optional().default(""),
  shipCity: z.string().trim().min(1).max(80),
  shipLine1: z.string().trim().min(3).max(200),
  shipPostalCode: z.string().trim().min(2).max(20),
  couponCode: z.string().trim().max(40).optional()
});

export async function POST(req: Request) {
  const user = await getUser();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your shipping details." }, { status: 400 });
  }

  const result = await createOrderFromCart({
    userId: user?.id,
    email: user?.email ?? parsed.data.email,
    phone: parsed.data.phone,
    shipFullName: parsed.data.shipFullName,
    shipCountry: parsed.data.shipCountry,
    shipState: parsed.data.shipState ?? "",
    shipCity: parsed.data.shipCity,
    shipLine1: parsed.data.shipLine1,
    shipPostalCode: parsed.data.shipPostalCode,
    couponCode: parsed.data.couponCode
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    total: result.order.total.toString(),
    currency: result.order.currency
  });
}
