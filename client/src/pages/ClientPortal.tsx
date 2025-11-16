import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, User, Calendar, FileText, Download, DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useParams } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { ChatBox } from "@/components/ChatBox";

function CaseInstallments({ token }: { token: string }) {
  const { data: installments, isLoading } = trpc.installments.listForPortal.useQuery(
    { token },
    { enabled: !!token }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const getStatusBadge = (installment: any) => {
    const dueDate = new Date(installment.dueDate);
    const now = new Date();
    const isOverdue = installment.status === "pending" && dueDate < now;
    
    if (installment.status === "paid") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Pago</Badge>;
    }
    if (isOverdue || installment.status === "overdue") {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs"><AlertCircle className="h-3 w-3 mr-1" />Atrasado</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
  };

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">Carregando parcelas...</p>
      </div>
    );
  }

  if (!installments || installments.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <DollarSign className="h-4 w-4" />
          <span className="font-medium">Parcelas</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Nenhuma parcela cadastrada
        </p>
      </div>
    );
  }

  const pendingInstallments = installments.filter(i => i.status === "pending" || i.status === "overdue");
  const paidInstallments = installments.filter(i => i.status === "paid");

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <DollarSign className="h-4 w-4" />
        <span className="font-medium">Parcelas</span>
      </div>
      
      {pendingInstallments.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Pendentes</p>
          <div className="space-y-2">
            {pendingInstallments.map((installment) => (
              <div key={installment.id} className="text-sm p-2 rounded bg-yellow-50 border border-yellow-200">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-medium text-xs block">Parcela {installment.installmentNumber} - {installment.caseTitle || 'Processo'}</span>
                    {installment.caseProcessNumber && (
                      <span className="text-xs text-muted-foreground">{installment.caseProcessNumber}</span>
                    )}
                  </div>
                  {getStatusBadge(installment)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vencimento: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(installment.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {paidInstallments.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Pagas</p>
          <div className="space-y-2">
            {paidInstallments.slice(0, 3).map((installment) => (
              <div key={installment.id} className="text-sm p-2 rounded bg-green-50 border border-green-200">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-medium text-xs block">Parcela {installment.installmentNumber} - {installment.caseTitle || 'Processo'}</span>
                    {installment.caseProcessNumber && (
                      <span className="text-xs text-muted-foreground">{installment.caseProcessNumber}</span>
                    )}
                  </div>
                  {getStatusBadge(installment)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pago em: {installment.paidAt ? new Date(installment.paidAt).toLocaleDateString('pt-BR') : '-'}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(installment.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CaseDocuments({ caseId, token }: { caseId: number; token: string }) {
  const { data: documents, isLoading } = trpc.documents.listForPortal.useQuery(
    { caseId, token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">Carregando documentos...</p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <FileText className="h-4 w-4" />
          <span className="font-medium">Documentos</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Nenhum documento anexado ainda
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <FileText className="h-4 w-4" />
        <span className="font-medium">Documentos</span>
      </div>
      <div className="space-y-2">
        {documents.slice(0, 5).map((doc) => (
          <div key={doc.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs truncate">{doc.fileName}</p>
              {doc.description && (
                <p className="text-xs text-muted-foreground">{doc.description}</p>
              )}
            </div>
            <button
              onClick={() => window.open(doc.fileUrl, '_blank')}
              className="ml-2 p-1 hover:bg-muted rounded"
            >
              <Download className="h-3 w-3" />
            </button>
          </div>
        ))}
        {documents.length > 5 && (
          <p className="text-xs text-muted-foreground">
            + {documents.length - 5} documentos
          </p>
        )}
      </div>
    </div>
  );
}

function CaseUpdates({ caseId, token }: { caseId: number; token: string }) {
  const { data: updates, isLoading } = trpc.caseUpdates.listForPortal.useQuery(
    { caseId, token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">Carregando atualizações...</p>
      </div>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <FileText className="h-4 w-4" />
          <span className="font-medium">Últimas Atualizações</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Nenhuma atualização registrada ainda
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <FileText className="h-4 w-4" />
        <span className="font-medium">Últimas Atualizações</span>
      </div>
      <div className="space-y-3">
        {updates.slice(0, 3).map((update) => (
          <div key={update.id} className="text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{update.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(update.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
                {update.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {update.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {updates.length > 3 && (
          <p className="text-xs text-muted-foreground">
            + {updates.length - 3} atualizações anteriores
          </p>
        )}
      </div>
    </div>
  );
}

export default function ClientPortal() {
  const { token } = useParams();
  
  const { data: client, isLoading: loadingClient } = trpc.clients.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );
  
  const { data: allCases, isLoading: loadingCases } = trpc.cases.list.useQuery(
    undefined,
    { enabled: false } // Não carregar automaticamente
  );
  
  // Buscar processos do cliente via procedure pública
  const { data: clientCases } = trpc.cases.getByClient.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Em Andamento", className: "bg-green-100 text-green-700 hover:bg-green-100" },
      won: { label: "Ganho", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
      lost: { label: "Perdido", className: "bg-red-100 text-red-700 hover:bg-red-100" },
      archived: { label: "Arquivado", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
    };
    const variant = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seus processos...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Link Inválido</h2>
            <p className="text-muted-foreground">
              Este link de acesso não é válido ou expirou. Entre em contato com seu advogado para obter um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f6f8ff,_#fdf7f1)]">
      {/* Header */}
      <header className="bg-white/80 border-b sticky top-0 z-20 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt="Logo" className="h-8 w-8 object-contain" />
            <span className="font-bold text-xl">MARQLET</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{client.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        <div className="mb-8 text-center md:text-left">
          <p className="section-eyebrow mb-2 text-center md:text-left">Portal do cliente</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Olá, {client.name}</h1>
          <p className="text-muted-foreground max-w-2xl">
            Aqui você encontra atualizações oficiais, documentos e mensagens trocadas com o escritório. Tudo protegido e em tempo real.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="rounded-2xl border bg-white/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Processos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clientCases?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {clientCases?.filter(c => c.status === "active").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Finalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {clientCases?.filter(c => c.status === "won" || c.status === "lost" || c.status === "archived").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processos */}
        {loadingCases ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Carregando processos...</p>
            </CardContent>
          </Card>
        ) : clientCases && clientCases.length > 0 ? (
          <div className="space-y-4">
            {clientCases.map((caseItem) => (
              <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <CardTitle>{caseItem.title}</CardTitle>
                      </div>
                      {caseItem.processNumber && (
                        <p className="text-sm text-muted-foreground">
                          Processo: {caseItem.processNumber}
                        </p>
                      )}
                      {caseItem.court && (
                        <p className="text-sm text-muted-foreground">
                          {caseItem.court}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(caseItem.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {caseItem.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {caseItem.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {caseItem.filingDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Ajuizado em {new Date(caseItem.filingDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Linha do Tempo */}
                  <CaseUpdates caseId={caseItem.id} token={token || ""} />
                  
                  {/* Documentos */}
                  <CaseDocuments caseId={caseItem.id} token={token || ""} />
                  
                  {/* Parcelas */}
                  <CaseInstallments token={token || ""} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                Nenhum processo cadastrado
              </p>
              <p className="text-sm text-muted-foreground">
                Quando seu advogado cadastrar processos para você, eles aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> Salve este link nos favoritos do seu navegador para acessar seus processos a qualquer momento. Não compartilhe este link com outras pessoas.
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Chat Flutuante */}
      {client && token && clientCases && clientCases.length > 0 && (
        <ChatBox
          caseId={clientCases[0].id}
          token={token}
        />
      )}
    </div>
  );
}
