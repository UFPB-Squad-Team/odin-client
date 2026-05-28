import { RouteLoadingScreen } from "@/components/ui/route-loading-screen";

export default function Loading() {
  return (
    <RouteLoadingScreen
      title="Carregando escola"
      description="Buscando os detalhes da unidade selecionada."
    />
  );
}