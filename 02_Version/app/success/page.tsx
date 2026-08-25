import DeliveryStatus from "./DeliveryStatus";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId = "" } = await searchParams;

  return (
    <main className="statusPage">
      <div className="statusCard">
        <p className="eyebrow">Payment received</p>
        <h1>Your BIMVERSE product is being prepared.</h1>
        <DeliveryStatus sessionId={sessionId} />
        <a className="secondaryButton" href="/">Return to BIMVERSE</a>
      </div>
    </main>
  );
}
