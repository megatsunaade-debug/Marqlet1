import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Calendar } from "lucide-react";
import { Link } from "wouter";
import { APP_LOGO } from "@/const";
import { PageNavigation } from "@/components/PageNavigation";

export default function Financial() {
  const { data: installments, isLoading, refetch } = trpc.installments.listByUser.useQuery();
  
  const markAsPaid = trpc.installments.markAsPaid.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/dashboard">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src={APP_LOGO} alt="Logo" className="h-8 w-8 object-contain" />
                <span className="font-bold text-xl">MARQLET</span>
              </div>
            </Link>
          </div>
        </header>
        <div className="container py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Calcular métricas
  const totalPending = installments?.filter(i => i.status === "pending" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0) || 0;
  const totalPaid = installments?.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0) || 0;
  const overdueCount = installments?.filter(i => i.status === "overdue" || (i.status === "pending" && new Date(i.dueDate) < new Date())).length || 0;
  const thisMonthDue = installments?.filter(i => {
    const dueDate = new Date(i.dueDate);
    const now = new Date();
    return i.status === "pending" && 
           dueDate.getMonth() === now.getMonth() && 
           dueDate.getFullYear() === now.getFullYear();
  }).reduce((sum, i) => sum + i.amount, 0) || 0;

  const getStatusBadge = (installment: any) => {
    const dueDate = new Date(installment.dueDate);
    const now = new Date();
    const isOverdue = installment.status === "pending" && dueDate < now;
    
    if (installment.status === "paid") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />Pago</Badge>;
    }
    if (isOverdue || installment.status === "overdue") {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><AlertCircle className="h-3 w-3 mr-1" />Atrasado</Badge>;
    }
    if (installment.status === "cancelled") {
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelado</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={APP_LOGO} alt="Logo" className="h-8 w-8 object-contain" />
              <span className="font-bold text-xl">MARQLET</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <PageNavigation />
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Controle de honorários, parcelas e recebimentos
          </p>
        </div>

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                A Receber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Parcelas pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total pago
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Parcelas vencidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(thisMonthDue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Vencimentos do mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Parcelas */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Parcelas</CardTitle>
            <CardDescription>
              Histórico completo de parcelas e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {installments && installments.length > 0 ? (
              <div className="space-y-3">
                {installments.map((installment) => (
                  <div key={installment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">
                          Parcela {installment.installmentNumber} - {installment.caseTitle || `Processo #${installment.caseId}`}
                        </p>
                        {installment.caseProcessNumber && (
                          <p className="text-xs text-muted-foreground">
                            Processo: {installment.caseProcessNumber}
                          </p>
                        )}
                        {getStatusBadge(installment)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Vencimento: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">{formatCurrency(installment.amount)}</span>
                        {installment.paidAt && (
                          <>
                            <span>•</span>
                            <span>Pago em: {new Date(installment.paidAt).toLocaleDateString('pt-BR')}</span>
                          </>
                        )}
                        {installment.paymentMethod && (
                          <>
                            <span>•</span>
                            <span>{installment.paymentMethod}</span>
                          </>
                        )}
                      </div>
                      {installment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{installment.notes}</p>
                      )}
                    </div>
                    {installment.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => markAsPaid.mutate({ id: installment.id, paymentMethod: "Manual" })}
                        disabled={markAsPaid.isPending}
                      >
                        Marcar como Pago
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma parcela cadastrada ainda
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
