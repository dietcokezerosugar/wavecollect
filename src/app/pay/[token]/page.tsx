import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Verify the token exists before redirecting
  const intent = await prisma.paymentIntent.findUnique({
    where: { paymentToken: token },
    select: { id: true },
  });

  if (!intent) {
    notFound();
  }

  // Redirect to the raw HTML checkout page
  redirect(`/checkout/${token}`);
}
