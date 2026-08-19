"use client";

import { useEffect, useState } from "react";

type DeliveryState =
  | { status: "waiting" }
  | { status: "ready"; downloadUrl: string }
  | { status: "error"; message: string };

export default function DeliveryStatus({ sessionId }: { sessionId: string }) {
  const [delivery, setDelivery] = useState<DeliveryState>(
    sessionId
      ? { status: "waiting" }
      : { status: "error", message: "The payment reference is missing. Please contact BIMVERSE support with your Stripe receipt." },
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let attempts = 0;

    async function checkDelivery() {
      attempts += 1;
      try {
        const response = await fetch(`/api/delivery/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const result = await response.json() as { ready?: boolean; downloadUrl?: string; error?: string };
        if (cancelled) return;
        if (response.ok && result.ready && result.downloadUrl) {
          setDelivery({ status: "ready", downloadUrl: result.downloadUrl });
          return;
        }
        if (response.status >= 400 && response.status !== 404) {
          setDelivery({ status: "error", message: result.error ?? "Your download could not be prepared." });
          return;
        }
      } catch {
        if (attempts >= 20 && !cancelled) {
          setDelivery({ status: "error", message: "Delivery is taking longer than expected. Please refresh this page in a moment." });
          return;
        }
      }
      if (attempts < 20 && !cancelled) window.setTimeout(checkDelivery, 1500);
      else if (!cancelled) setDelivery({ status: "error", message: "Delivery is taking longer than expected. Please refresh this page in a moment." });
    }

    void checkDelivery();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (delivery.status === "ready") {
    return (
      <div className="deliveryReady" role="status">
        <p>Your protected download is ready. This link expires after seven days and supports up to five downloads.</p>
        <a className="primaryButton" href={delivery.downloadUrl}>Download Product 01</a>
      </div>
    );
  }

  if (delivery.status === "error") return <p className="deliveryError" role="alert">{delivery.message}</p>;
  return <p className="deliveryWaiting" role="status">Confirming payment and creating your secure download…</p>;
}
