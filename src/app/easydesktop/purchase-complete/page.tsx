import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { recordEasyDesktopPurchase } from "@/lib/easydesktopPurchase";

export const dynamic = "force-dynamic";

export default async function PurchaseCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = String(params.session_id || "");

  if (!sessionId) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8">
          <h1 className="text-3xl font-bold text-white">Purchase information missing</h1>
          <p className="mt-3 text-red-100">We could not verify an EasyDesktop purchase.</p>
          <Link href="/easydesktop" className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
            Return to EasyDesktop
          </Link>
        </div>
      </main>
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const valid =
    session.mode === "payment" &&
    session.metadata?.product_key === "easydesktop10" &&
    session.payment_status === "paid";

  if (valid) {
    await recordEasyDesktopPurchase(session);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 md:p-10">
        {valid ? (
          <>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Payment Complete
            </div>
            <h1 className="mt-3 text-4xl font-bold text-white">
              Thank you for purchasing EasyDesktop 10.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Your payment has been confirmed. Your full EasyDesktop installer is ready to download.
            </p>
            {session.customer_details?.email ? (
              <p className="mt-3 text-sm text-slate-400">
                Purchase email: {session.customer_details.email}
              </p>
            ) : null}
            <a
              href={`/api/easydesktop/paid-download?session_id=${encodeURIComponent(session.id)}`}
              className="mt-7 inline-flex rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Download EasyDesktop 10
            </a>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              This download link verifies your Stripe purchase before providing the installer.
            </p>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
              Payment Not Confirmed
            </div>
            <h1 className="mt-3 text-4xl font-bold text-white">
              We could not confirm the payment.
            </h1>
            <p className="mt-4 text-slate-300">
              If you believe the payment completed, contact support@microseconds.com and include the email address used during checkout.
            </p>
            <Link href="/easydesktop" className="mt-7 inline-flex rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">
              Return to EasyDesktop
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
