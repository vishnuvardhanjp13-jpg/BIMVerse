import { env } from "cloudflare:workers";

type CheckoutBindings = {
  NEXT_PUBLIC_STRIPE_BEP_STANDARD_URL?: string;
  NEXT_PUBLIC_STRIPE_BEP_PROFESSIONAL_URL?: string;
  NEXT_PUBLIC_STRIPE_BEP_ASSISTED_URL?: string;
  NEXT_PUBLIC_STRIPE_APPENDIX_URL?: string;
  NEXT_PUBLIC_STRIPE_APPENDIX_STANDARD_URL?: string;
  NEXT_PUBLIC_STRIPE_APPENDIX_PROFESSIONAL_URL?: string;
  NEXT_PUBLIC_STRIPE_APPENDIX_ULTIMATE_URL?: string;
};

const bindingNames: Record<string, keyof CheckoutBindings> = {
  "bep-standard": "NEXT_PUBLIC_STRIPE_BEP_STANDARD_URL",
  "bep-professional": "NEXT_PUBLIC_STRIPE_BEP_PROFESSIONAL_URL",
  "bep-assisted": "NEXT_PUBLIC_STRIPE_BEP_ASSISTED_URL",
  appendix: "NEXT_PUBLIC_STRIPE_APPENDIX_URL",
  "appendix-standard": "NEXT_PUBLIC_STRIPE_APPENDIX_STANDARD_URL",
  "appendix-professional": "NEXT_PUBLIC_STRIPE_APPENDIX_PROFESSIONAL_URL",
  "appendix-ultimate": "NEXT_PUBLIC_STRIPE_APPENDIX_ULTIMATE_URL",
};

export async function GET(_request: Request, context: { params: Promise<{ product: string }> }) {
  const { product } = await context.params;
  const bindingName = bindingNames[product];
  const bindings = env as unknown as CheckoutBindings;
  const checkoutUrl = bindingName ? bindings[bindingName] : undefined;
  if (!checkoutUrl || !checkoutUrl.startsWith("https://buy.stripe.com/")) {
    return new Response("This Stripe checkout is being configured. Please try again soon.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return Response.redirect(checkoutUrl, 302);
}
