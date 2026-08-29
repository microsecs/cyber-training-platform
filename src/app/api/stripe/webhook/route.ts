import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  subscriptionIdFromInvoice,
  syncStripeSubscription,
} from "@/lib/stripeSubscriptionSync";

export const runtime = "nodejs";

async function retrieveSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error?.message || "Invalid signature"}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session: any = event.data.object;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          const subscription = await retrieveSubscription(subscriptionId);
          await syncStripeSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const eventSubscription: any = event.data.object;
        if (eventSubscription?.id) {
          // Re-read the subscription from Stripe so delayed/out-of-order webhook
          // deliveries still synchronize the latest Stripe state.
          try {
            const subscription = await retrieveSubscription(eventSubscription.id);
            await syncStripeSubscription(subscription);
          } catch (error: any) {
            // A deleted subscription may no longer be retrievable. In that case,
            // the event object itself contains the terminal state we need.
            if (event.type === "customer.subscription.deleted") {
              await syncStripeSubscription(eventSubscription as Stripe.Subscription, {
                paymentFailed: false,
                paymentFailedAt: null,
              });
            } else {
              throw error;
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (subscriptionId) {
          const subscription = await retrieveSubscription(subscriptionId);
          await syncStripeSubscription(subscription, {
            paymentFailed: true,
            paymentFailedAt: new Date(event.created * 1000).toISOString(),
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (subscriptionId) {
          const subscription = await retrieveSubscription(subscriptionId);
          await syncStripeSubscription(subscription, {
            paymentFailed: false,
            paymentFailedAt: null,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook processing error", {
      eventId: event.id,
      eventType: event.type,
      error: error?.message || String(error),
    });

    // Return 500 so Stripe retries transient failures.
    return NextResponse.json(
      { error: error?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
