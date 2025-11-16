import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useCallback } from "react";

const features = [
  {
    title: "Portal do Cliente",
    description:
      "Mostre o andamento do processo com timeline, documentos e parcelas em um único link seguro.",
  },
  {
    title: "Chat Profissional",
    description:
      "Converse com seus clientes fora do WhatsApp pessoal e mantenha histórico por processo.",
  },
  {
    title: "Gestão Financeira",
    description:
      "Cadastre honorários, gere parcelas e acompanhe pagamentos com lembretes automáticos.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  const goToDashboard = useCallback(() => {
    window.location.href = "/dashboard";
  }, []);

  const goToLogin = useCallback(() => {
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_#f5f9ff,_#f9fbfd)]">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt="Logo" className="h-9 w-9 object-contain" />
            <span className="font-semibold tracking-tight">{APP_TITLE}</span>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button onClick={goToDashboard}>Ir para o Dashboard</Button>
            ) : (
              <Button onClick={goToLogin}>Entrar</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-20 md:py-28 text-center max-w-4xl">
          <div className="flex justify-center mb-6">
            <span className="px-4 py-2 rounded-full border text-primary bg-primary/10 text-sm font-medium">
              Comunicação Jurídica do Futuro
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary mb-4 tracking-tight">
            MARQLET
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">
            Comunicação Jurídica Inteligente
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-3">
            Transforme a comunicação com seus clientes em vantagem competitiva.
          </p>
          <p className="text-lg md:text-xl text-primary font-semibold mb-10">
            Menos interrupções, mais advocacia.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={isAuthenticated ? goToDashboard : goToLogin}>
              Começar Agora
            </Button>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="section-eyebrow mb-3">Como ajudamos</p>
              <h2 className="section-title">Recursos pensados para escritórios ágeis</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map(feature => (
                <div key={feature.title} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{APP_TITLE} © {new Date().getFullYear()}</span>
          <span>contato@marqlet.com</span>
        </div>
      </footer>
    </div>
  );
}
