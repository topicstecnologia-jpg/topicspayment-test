import { PlatformCheckoutScreen } from "@/components/checkout/platform-checkout-screen";

export default function OfferCheckoutCodePage({
  params
}: {
  params: {
    offerCode: string;
  };
}) {
  return <PlatformCheckoutScreen offerCode={params.offerCode} />;
}
