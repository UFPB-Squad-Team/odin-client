import { MimirChat } from "@/components/features/mimir/mimir-chat";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mimir • ODIN",
  description:
    "Assistente IA do ODIN - Tire dúvidas sobre dados territoriais do Nordeste.",
};

export default function MimirPage() {
  return <MimirChat />;
}