import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, MessageSquare, FileText, LogOut, DollarSign, Bell, Sparkles, CalendarClock } from "lucide-react";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageNavigation } from "@/components/PageNavigation";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Dashboard() {
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();
  const { data: cases, isLoading: loadingCases } = trpc.cases.list.useQuery();
  const { data: unreadCount } = trpc.messages.countUnread.useQuery();
  const me = trpc.auth.me.useQuery();
  const [phone, setPhone] = useState(me.data?.phone || "");
  const { data: waSettings } = trpc.auth.getWhatsappSettings.useQuery();
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waApiUrl, setWaApiUrl] = useState("https://graph.facebook.com/v18.0");

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => toast.success("Telefone salvo"),
    onError: err => toast.error(err.message),
  });
  const saveWaSettings = trpc.auth.saveWhatsappSettings.useMutation({
    onSuccess: () => toast.success("Credenciais do WhatsApp salvas"),
    onError: err => toast.error(err.message),
  });

  useEffect(() => {
    if (waSettings) {
      setWaToken(waSettings.token ?? "");
      setWaPhoneId(waSettings.phoneId ?? "");
      setWaApiUrl(waSettings.apiUrl ?? "https://graph.facebook.com/v18.0");
    }
  }, [waSettings]);

  const stats = [
    {
      title: "Clientes ativos",
      value: clients?.length || 0,
      subcopy: "Cadastrados neste mês",
      icon: Users,
      href: "/clients",
    },
    {
      title: "Processos em andamento",
      value: cases?.filter(c => c.status === "active").length || 0,
      subcopy: "Inclui audiências marcadas",
      icon: Briefcase,
      href: "/cases",
    },
    {
      title: "Mensagens pendentes",
      value: unreadCount || 0,
      subcopy: "Conversas aguardando retorno",
      icon: MessageSquare,
      href: "/chat",
    },
    {
      title: "Total de processos",
      value: cases?.length || 0,
      subcopy: "Incluindo finalizados",
      icon: FileText,
      href: "/cases",
    },
  ];

  const { logout } = useAuth();

  const isLoading = loadingClients || loadingCases;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-blue-50)_0%,_#fff_45%)]">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-20">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl tracking-tight">{APP_TITLE}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container py-10 space-y-8">
        <PageNavigation showBack={false} />
        <div className="rounded-3xl border bg-white p-6 md:p-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm">
          <div>
            <p className="section-eyebrow mb-2">Bem-vindo(a) de volta</p>
            <h1 className="text-3xl md:text-4xl font-semibold">Painel do escritório</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Acompanhe clientes, processos, conversas e finanças em um só lugar. Atualizações recentes e próximos passos aparecem aqui.
            </p>
          </div>
          <Button className="self-start md:self-auto flex items-center gap-2" variant="secondary" asChild>
            <Link href="/publications">
              <Sparkles className="h-4 w-4" />
              Checar novidades do DJE
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow border bg-white/90 cursor-pointer">
                <CardHeader className="space-y-1 pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-primary" />
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{isLoading ? "..." : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subcopy}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="border bg-white/90">
          <CardHeader>
            <CardTitle>Contato para lembretes (WhatsApp)</CardTitle>
            <CardDescription>
              Informe seu número para receber notificações dos lembretes. Use o formato com DDD (ex: 11999998888).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3 flex-col sm:flex-row">
            <Input
              placeholder="Seu número com DDD"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="sm:max-w-sm"
            />
            <Button
              onClick={() => updateProfile.mutate({ phone })}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-white/90">
          <CardHeader>
            <CardTitle>Integração WhatsApp (remetente)</CardTitle>
            <CardDescription>
              Configure o token/Phone ID da Cloud API do escritório. Mantemos fechado para não poluir a tela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="">
              <AccordionItem value="wa-settings">
                <AccordionTrigger className="text-sm">Mostrar configurações avançadas</AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Token</label>
                      <Input
                        value={waToken}
                        onChange={e => setWaToken(e.target.value)}
                        placeholder="EAAG..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Phone ID</label>
                      <Input
                        value={waPhoneId}
                        onChange={e => setWaPhoneId(e.target.value)}
                        placeholder="1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">API URL</label>
                      <Input
                        value={waApiUrl}
                        onChange={e => setWaApiUrl(e.target.value)}
                        placeholder="https://graph.facebook.com/v18.0"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        onClick={() => saveWaSettings.mutate({ token: waToken, phoneId: waPhoneId, apiUrl: waApiUrl })}
                        disabled={saveWaSettings.isPending}
                      >
                        {saveWaSettings.isPending ? "Salvando..." : "Salvar credenciais"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Dica: use um token permanente e o Phone ID da sua conta de WhatsApp Business.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
              <CardDescription>Acesse os fluxos mais usados em segundos</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {[
                { href: "/clients/new", label: "Novo Cliente", icon: Users },
                { href: "/cases/new", label: "Novo Processo", icon: Briefcase },
                { href: "/chat", label: "Mensagens", icon: MessageSquare },
                { href: "/financial", label: "Gestão Financeira", icon: DollarSign },
                { href: "/publications", label: "Publicações DJE", icon: Bell },
                { href: "/agenda", label: "Agenda do Escritório", icon: CalendarClock },
                { href: "/faq", label: "Gerenciar FAQ", icon: FileText },
              ].map(action => (
                <Link key={action.href} href={action.href}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Processos recentes</CardTitle>
              <CardDescription>Últimas movimentações registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCases ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : cases && cases.length > 0 ? (
                <div className="space-y-3">
                  {cases.slice(0, 5).map(caseItem => (
                    <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-xl border bg-white hover:bg-primary/5 transition">
                        <div>
                          <p className="font-medium text-sm">{caseItem.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.processNumber || "Sem número"}
                          </p>
                        </div>
                        <span
                          className={`pill ${
                            caseItem.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : caseItem.status === "won"
                                ? "bg-blue-50 text-blue-700"
                                : caseItem.status === "lost"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {caseItem.status === "active"
                            ? "Ativo"
                            : caseItem.status === "won"
                              ? "Ganho"
                              : caseItem.status === "lost"
                                ? "Perdido"
                                : "Arquivado"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum processo cadastrado ainda
                  </p>
                  <Link href="/cases/new">
                    <Button size="sm">Criar primeiro processo</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
