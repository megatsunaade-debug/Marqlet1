import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, User, Briefcase, Copy, Check } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { PageNavigation } from "@/components/PageNavigation";

export default function ClientDetail() {
  const { id } = useParams();
  const clientId = parseInt(id || "0");
  const [copiedToken, setCopiedToken] = useState(false);
  
  const { data: clients, isLoading: loadingClient } = trpc.clients.list.useQuery();
  const { data: cases, isLoading: loadingCases } = trpc.cases.list.useQuery();
  
  const client = clients?.find(c => c.id === clientId);
  const clientCases = cases?.filter(c => c.clientId === clientId);

  const copyAccessToken = () => {
    if (client?.accessToken) {
      const portalUrl = `${window.location.origin}/portal/${client.accessToken}`;
      navigator.clipboard.writeText(portalUrl);
      setCopiedToken(true);
      toast.success("Link de acesso copiado!");
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Ativo", className: "bg-green-100 text-green-700 hover:bg-green-100" },
      won: { label: "Ganho", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
      lost: { label: "Perdido", className: "bg-red-100 text-red-700 hover:bg-red-100" },
      archived: { label: "Arquivado", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
    };
    const variant = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loadingClient) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Carregando cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Link href="/clients">
          <Button className="mt-4">Voltar para Clientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      <Link href="/clients">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Clientes
        </Button>
      </Link>
      <PageNavigation />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{client.name}</h1>
        </div>
        <p className="text-muted-foreground">
          Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{client.email}</p>
                  </div>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p>{client.phone}</p>
                  </div>
                </div>
              )}

              {client.cpf && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p>{client.cpf}</p>
                  </div>
                </div>
              )}

              {!client.email && !client.phone && !client.cpf && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma informação de contato adicional cadastrada
                </p>
              )}
            </CardContent>
          </Card>

          {/* Processos do Cliente */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Processos</CardTitle>
                <Link href="/cases/new">
                  <Button size="sm">Novo Processo</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCases ? (
                <p className="text-sm text-muted-foreground">Carregando processos...</p>
              ) : clientCases && clientCases.length > 0 ? (
                <div className="space-y-3">
                  {clientCases.map((caseItem) => (
                    <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                      <div className="flex items-center justify-between p-3 rounded border hover:bg-accent cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{caseItem.title}</p>
                            {caseItem.processNumber && (
                              <p className="text-xs text-muted-foreground">
                                {caseItem.processNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(caseItem.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum processo cadastrado para este cliente
                  </p>
                  <Link href="/cases/new">
                    <Button size="sm">Criar Primeiro Processo</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Portal do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Portal do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Compartilhe este link com o cliente para acesso ao portal:
              </p>
              <div className="p-2 bg-muted rounded text-xs break-all">
                {window.location.origin}/portal/{client.accessToken}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={copyAccessToken}
              >
                {copiedToken ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                O cliente poderá acessar seus processos sem precisar de senha
              </p>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-2xl font-bold">{clientCases?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total de Processos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clientCases?.filter(c => c.status === "active").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Processos Ativos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clientCases?.filter(c => c.status === "won").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Processos Ganhos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
