import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, FileText, Gavel } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { PageNavigation } from "@/components/PageNavigation";

export default function Publications() {
  const { data: publications, isLoading, refetch } = trpc.publications.listAll.useQuery();
  const markAsRead = trpc.publications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Publicação marcada como lida");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando publicações...</div>
        </div>
      </div>
    );
  }

  const unreadCount = publications?.filter(p => p.isRead === 0).length || 0;

  return (
    <div className="container py-8">
      <PageNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Publicações do DJE
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe as publicações e movimentações dos seus processos
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
          </Badge>
        )}
      </div>

      {!publications || publications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma publicação encontrada
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              As publicações aparecerão aqui quando você consultar processos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {publications.map((pub) => (
            <Card
              key={pub.id}
              className={pub.isRead === 0 ? "border-l-4 border-l-blue-500" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{pub.source}</Badge>
                      {pub.isRead === 0 && (
                        <Badge variant="default">Nova</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      {pub.movementName}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Processo: {pub.case.title || `#${pub.case.processNumber}`}
                    </CardDescription>
                  </div>
                  {pub.isRead === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead.mutate({ id: pub.id })}
                    >
                      Marcar como lida
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pub.content && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{pub.content}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(pub.publishedAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    {pub.movementCode && (
                      <div>Código: {pub.movementCode}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
