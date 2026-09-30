import type { ReactNode } from "react";
import { PageBackBar } from "@/components/common/PageBackBar";

/** Checkout keeps its own focused design; it only gains a Back button (hidden on the order-confirmation pages). */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageBackBar hideOn={["/order-success"]} fallbackHref="/cart" />
      {children}
    </>
  );
}
