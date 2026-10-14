// Inactive placement reserved for a future approved advertising integration.
// No script, network request, layout space or tracking is enabled by this file.
export function AdvertisingSlot({ position }: { position: "after-generator" | "after-content" }) {
  return <aside hidden aria-hidden="true" data-ad-placement={position} />;
}
