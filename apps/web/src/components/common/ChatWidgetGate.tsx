"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// The chat widget is non-critical: load its code after the page is interactive, and never on admin screens.
const ChatWidget = dynamic(() => import("./ChatWidget").then((m) => m.ChatWidget), { ssr: false });

export function ChatWidgetGate() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/portal-")) return null;
  return <ChatWidget />;
}
