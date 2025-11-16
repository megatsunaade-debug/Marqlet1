import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { PageNavigation } from "@/components/PageNavigation";

export default function Chat() {
  const { user } = useAuth();
  const { caseId } = useParams();
  const initialCaseId = caseId ? parseInt(caseId) : null;
  const [selectedCase, setSelectedCase] = useState<number | null>(initialCaseId);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const markAsReadMutation = trpc.messages.markAsRead.useMutation({
    onSuccess: () => {
      utils.messages.countUnread.invalidate();
    },
  });

  const { data: cases } = trpc.cases.list.useQuery();
  const { data: messages, isLoading: loadingMessages } = trpc.messages.list.useQuery(
    { caseId: selectedCase || 0 },
    { 
      enabled: !!selectedCase,
      refetchInterval: 3000 // Atualizar a cada 3 segundos
    }
  );

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage("");
      if (selectedCase) {
        utils.messages.list.invalidate({ caseId: selectedCase });
      }
      scrollToBottom();
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectCase = (caseId: number) => {
    setSelectedCase(caseId);
    // Marcar mensagens como lidas
    markAsReadMutation.mutate({ caseId });
  };

  const handleSend = () => {
    if (!message.trim() || !selectedCase || !user) return;

    sendMutation.mutate({
      caseId: selectedCase,
      content: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedCaseData = cases?.find(c => c.id === selectedCase);

  return (
    <div className="container py-8 max-w-6xl">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </Link>
      <PageNavigation />

      <h1 className="text-3xl font-bold mb-6">Mensagens</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Lista de Processos */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Processos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cases && cases.length > 0 ? (
              <div className="divide-y">
                {cases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => handleSelectCase(caseItem.id)}
                    className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                      selectedCase === caseItem.id ? "bg-accent" : ""
                    }`}
                  >
                    <p className="font-medium text-sm">{caseItem.client?.name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{caseItem.title}</p>
                    {caseItem.processNumber && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Nº {caseItem.processNumber}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum processo cadastrado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="md:col-span-2">
          {selectedCase ? (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {selectedCaseData?.client?.name || "Cliente"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCaseData?.title}
                  {selectedCaseData?.processNumber && ` - Nº ${selectedCaseData.processNumber}`}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages Area */}
                <div className="h-96 overflow-y-auto p-4 space-y-3 bg-muted/20">
                  {loadingMessages ? (
                    <p className="text-sm text-muted-foreground text-center">
                      Carregando mensagens...
                    </p>
                  ) : messages && messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderType === "lawyer" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            msg.senderType === "lawyer"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {msg.senderType === "lawyer" ? "Você" : "Cliente"}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma mensagem ainda
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inicie a conversa com seu cliente
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendMutation.isPending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || sendMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-full flex items-center justify-center py-24">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Selecione um processo
                </p>
                <p className="text-sm text-muted-foreground">
                  Escolha um processo na lista ao lado para ver as mensagens
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
