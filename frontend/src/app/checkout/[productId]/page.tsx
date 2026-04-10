import { PlatformCheckoutScreen } from "@/components/checkout/platform-checkout-screen";

export default function CheckoutPage({
  params
}: {
  params: {
    productId: string;
  };
}) {
  return <PlatformCheckoutScreen productId={params.productId} />;
}
