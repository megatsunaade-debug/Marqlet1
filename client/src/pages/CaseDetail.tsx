import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, FileText, MessageSquare, Plus, CheckCircle2, XCircle, Archive, Upload, Download, Trash2, DollarSign, Bell, RefreshCw, CalendarClock, AlarmClock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { PageNavigation } from "@/components/PageNavigation";

export default function CaseDetail() {
  const { id } = useParams();
  const caseId = parseInt(id || "0");
  
  const { data: caseData, isLoading } = trpc.cases.getById.useQuery({ id: caseId });
  const { data: updates, refetch: refetchUpdates } = trpc.caseUpdates.list.useQuery({ caseId });
  const { data: client } = trpc.clients.list.useQuery();
  
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    title: "",
    description: "",
  });

  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    description: "",
    file: null as File | null,
  });

  const { data: documents, refetch: refetchDocuments } = trpc.documents.list.useQuery({ caseId });
  const { data: fees, refetch: refetchFees } = trpc.fees.listByCase.useQuery({ caseId });
  const { data: installments, refetch: refetchInstallments } = trpc.installments.listByUser.useQuery();
  const { data: publications, refetch: refetchPublications } = trpc.publications.list.useQuery({ caseId });
  const { data: tasks, refetch: refetchTasks } = trpc.tasks.listByCase.useQuery({ caseId });

  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeForm, setFeeForm] = useState({
    totalAmount: "",
    paymentType: "cash" as "cash" | "installments",
    installmentsCount: "1",
    description: "",
  });

  const [showPublicationForm, setShowPublicationForm] = useState(false);
  const [publicationForm, setPublicationForm] = useState({
    movementType: "",
    publishedAt: new Date().toISOString().split('T')[0],
    content: "",
  });

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    reminderMinutesBefore: "60",
  });

  const uploadDocument = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      setShowDocumentForm(false);
      setDocumentForm({ description: "", file: null });
      refetchDocuments();
    },
    onError: (error) => {
      toast.error("Erro ao enviar documento: " + error.message);
    },
  });

  const deleteDocument = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento excluído com sucesso!");
      refetchDocuments();
    },
    onError: (error) => {
      toast.error("Erro ao excluir documento: " + error.message);
    },
  });

  const createUpdate = trpc.caseUpdates.create.useMutation({
    onSuccess: () => {
      toast.success("Atualização adicionada com sucesso!");
      setShowUpdateForm(false);
      setUpdateForm({ title: "", description: "" });
      refetchUpdates();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar atualização: " + error.message);
    },
  });

  const createFee = trpc.fees.create.useMutation({
    onSuccess: () => {
      toast.success("Honorário cadastrado com sucesso!");
      setShowFeeForm(false);
      setFeeForm({ totalAmount: "", paymentType: "cash", installmentsCount: "1", description: "" });
      refetchFees();
      refetchInstallments();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar honorário: " + error.message);
    },
  });

  const checkPublications = trpc.publications.checkForNew.useMutation({
    onSuccess: (data) => {
      if (data.newCount > 0) {
        toast.success(`${data.newCount} nova(s) publicação(ões) encontrada(s)!`);
      } else {
        toast.info("Nenhuma nova publicação encontrada");
      }
      refetchPublications();
      refetchUpdates();
    },
    onError: (error) => {
      toast.error("Erro ao consultar publicações: " + error.message);
    },
  });

  const createPublication = trpc.publications.create.useMutation({
    onSuccess: () => {
      toast.success("Publicação adicionada com sucesso!");
      setShowPublicationForm(false);
      setPublicationForm({ movementType: "", publishedAt: new Date().toISOString().split('T')[0], content: "" });
      refetchPublications();
      refetchUpdates();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar publicação: " + error.message);
    },
  });

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Lembrete criado!");
      setShowTaskForm(false);
      setTaskForm({ title: "", description: "", dueDate: "", priority: "medium", reminderMinutesBefore: "60" });
      refetchTasks();
    },
    onError: error => toast.error("Erro ao criar lembrete: " + error.message),
  });

  const updateTaskStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      refetchTasks();
    },
    onError: error => toast.error("Erro ao atualizar status: " + error.message),
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Lembrete removido");
      refetchTasks();
    },
    onError: error => toast.error("Erro ao remover lembrete: " + error.message),
  });

  type TaskItem = NonNullable<typeof tasks>[number];
  const formatTaskDueDate = (value: string | Date) =>
    new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderTaskBadge = (task: TaskItem) => {
    if (task.status === "completed") {
      return <Badge className="bg-emerald-100 text-emerald-700">Concluído</Badge>;
    }
    if (task.status === "in_progress") {
      return <Badge className="bg-blue-100 text-blue-700">Em andamento</Badge>;
    }
    if (task.status === "overdue" || new Date(task.dueDate) < new Date()) {
      return <Badge className="bg-red-100 text-red-700">Atrasado</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700">Pendente</Badge>;
  };

  const sortedTasks = tasks ? [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) : [];

  const utils = trpc.useUtils();
  const updateStatus = trpc.cases.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.cases.getById.invalidate({ id: caseId });
      utils.cases.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateForm.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    createUpdate.mutate({
      caseId,
      title: updateForm.title,
      description: updateForm.description || undefined,
    });
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

  if (isLoading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Carregando processo...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Processo não encontrado</p>
        <Link href="/cases">
          <Button className="mt-4">Voltar para Processos</Button>
        </Link>
      </div>
    );
  }

  const caseClient = client?.find(c => c.id === caseData.clientId);

  return (
    <div className="container py-8 max-w-5xl">
      <Link href="/cases">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Processos
        </Button>
      </Link>
      <PageNavigation />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{caseData.title}</h1>
            {caseData.processNumber && (
              <p className="text-muted-foreground">
                Processo: {caseData.processNumber}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(caseData.status)}
            <Select
              value={caseData.status}
              onValueChange={(value: 'active' | 'won' | 'lost' | 'archived') => {
                updateStatus.mutate({ id: caseId, status: value });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alterar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Em Andamento
                  </div>
                </SelectItem>
                <SelectItem value="won">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Ganho
                  </div>
                </SelectItem>
                <SelectItem value="lost">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Perdido
                  </div>
                </SelectItem>
                <SelectItem value="archived">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-gray-600" />
                    Arquivado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações do Processo */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.description && (
                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="mt-1">{caseData.description}</p>
                </div>
              )}
              
              {caseData.court && (
                <div>
                  <Label className="text-muted-foreground">Vara/Tribunal</Label>
                  <p className="mt-1">{caseData.court}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {caseData.filingDate && (
                  <div>
                    <Label className="text-muted-foreground">Data de Ajuizamento</Label>
                    <p className="mt-1">
                      {new Date(caseData.filingDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Criado em</Label>
                  <p className="mt-1">
                    {new Date(caseData.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linha do Tempo de Atualizações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Linha do Tempo</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Atualização
                </Button>
              </div>
              <CardDescription>
                Histórico de andamentos do processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showUpdateForm && (
                <form onSubmit={handleAddUpdate} className="mb-6 p-4 border rounded-lg space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="updateTitle">Título da Atualização</Label>
                    <Input
                      id="updateTitle"
                      value={updateForm.title}
                      onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                      placeholder="Ex: Audiência realizada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="updateDescription">Descrição</Label>
                    <Textarea
                      id="updateDescription"
                      value={updateForm.description}
                      onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                      placeholder="Detalhes da atualização..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={createUpdate.isPending}>
                      {createUpdate.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUpdateForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {updates && updates.length > 0 ? (
                <div className="space-y-4">
                  {updates.map((update, index) => (
                    <div key={update.id} className="relative pl-6 pb-4">
                      {index !== updates.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border" />
                      )}
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{update.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(update.updateDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {update.description && (
                          <p className="text-sm text-muted-foreground">
                            {update.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma atualização registrada ainda
                </p>
              )}
            </CardContent>
          </Card>

          {/* Publicações do DJE */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Publicações do DJE
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Consulte automaticamente as publicações deste processo
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPublicationForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Manual
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!caseData.processNumber) {
                        toast.error("Número do processo não cadastrado");
                        return;
                      }
                      if (!caseData.court) {
                        toast.error("Tribunal não especificado");
                        return;
                      }
                      
                      // Determina tribunal baseado no campo court
                      let tribunal: "TJSP" | "TRT2" | "TRT15" = "TJSP";
                      if (caseData.court.includes("TRT") || caseData.court.includes("2ª Região")) {
                        tribunal = "TRT2";
                      } else if (caseData.court.includes("15ª Região") || caseData.court.includes("Campinas")) {
                        tribunal = "TRT15";
                      }
                      
                      checkPublications.mutate({
                        caseId,
                        processNumber: caseData.processNumber,
                        tribunal,
                      });
                    }}
                    disabled={checkPublications.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${checkPublications.isPending ? 'animate-spin' : ''}`} />
                    {checkPublications.isPending ? "Consultando..." : "Consultar Agora"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {publications && publications.length > 0 ? (
                <div className="space-y-3">
                  {publications.slice(0, 5).map((pub) => (
                    <div key={pub.id} className="border-l-2 border-l-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{pub.movementName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(pub.publishedAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">{pub.source}</Badge>
                      </div>
                    </div>
                  ))}
                  {publications.length > 5 && (
                    <Link href="/publications">
                      <Button variant="link" className="w-full text-sm">
                        Ver todas as {publications.length} publicações
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma publicação encontrada. Clique em "Consultar Agora" para buscar publicações no DJE.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Agenda & Lembretes */}
          <Card className="mt-6" data-tasks-section>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agenda e Lembretes</CardTitle>
                <Button size="sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {showTaskForm ? "Cancelar" : "Novo lembrete"}
                </Button>
              </div>
              <CardDescription>
                Cadastre atividades com data limite e receba alertas antes do vencimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showTaskForm && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Título *</Label>
                      <Input
                        value={taskForm.title}
                        onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Protocolar contestação"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data e hora *</Label>
                      <Input
                        type="datetime-local"
                        value={taskForm.dueDate}
                        onChange={e => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={value => setTaskForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lembrete (minutos antes)</Label>
                      <Input
                        type="number"
                        min={5}
                        value={taskForm.reminderMinutesBefore}
                        onChange={e => setTaskForm(prev => ({ ...prev, reminderMinutesBefore: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={taskForm.description}
                      onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detalhes do que deve ser feito"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!taskForm.title.trim() || !taskForm.dueDate) {
                          toast.error("Título e data são obrigatórios");
                          return;
                        }
                        createTask.mutate({
                          caseId,
                          title: taskForm.title,
                          description: taskForm.description || undefined,
                          dueDate: new Date(taskForm.dueDate),
                          priority: taskForm.priority as "low" | "medium" | "high",
                          reminderMinutesBefore: parseInt(taskForm.reminderMinutesBefore, 10) || 60,
                        });
                      }}
                      disabled={createTask.isPending}
                    >
                      {createTask.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowTaskForm(false);
                        setTaskForm({ title: "", description: "", dueDate: "", priority: "medium", reminderMinutesBefore: "60" });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {sortedTasks.length > 0 ? (
                <div className="space-y-3">
                  {sortedTasks.map(task => (
                    <div key={task.id} className="p-3 border rounded-xl flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlarmClock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{task.title}</span>
                          {renderTaskBadge(task)}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Para {formatTaskDueDate(task.dueDate)} · Lembrete {task.reminderMinutesBefore} min antes · Prioridade {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {task.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus.mutate({ id: task.id, status: "completed" })}
                          >
                            Concluir
                          </Button>
                        )}
                        {task.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus.mutate({ id: task.id, status: "pending" })}
                          >
                            Reabrir
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Excluir este lembrete?")) {
                              deleteTaskMutation.mutate({ id: task.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lembrete cadastrado para este processo.</p>
              )}
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card data-documents-section>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documentos</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowDocumentForm(!showDocumentForm)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Documento
                </Button>
              </div>
              <CardDescription>
                PDFs, imagens e outros arquivos do processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showDocumentForm && (
                <div className="mb-6 p-4 border rounded-lg space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="documentFile">Arquivo</Label>
                    <Input
                      id="documentFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setDocumentForm({ ...documentForm, file });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentDescription">Descrição (opcional)</Label>
                    <Input
                      id="documentDescription"
                      value={documentForm.description}
                      onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                      placeholder="Ex: Contrato de trabalho"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!documentForm.file || uploadDocument.isPending}
                      onClick={async () => {
                        if (!documentForm.file) return;
                        
                        // Converter arquivo para base64
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                          const base64 = e.target?.result?.toString().split(',')[1];
                          if (!base64) {
                            toast.error("Erro ao processar arquivo");
                            return;
                          }
                          
                          uploadDocument.mutate({
                            caseId,
                            fileName: documentForm.file!.name,
                            fileData: base64,
                            mimeType: documentForm.file!.type,
                            description: documentForm.description || undefined,
                          });
                        };
                        reader.readAsDataURL(documentForm.file);
                      }}
                    >
                      {uploadDocument.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowDocumentForm(false);
                        setDocumentForm({ description: "", file: null });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="font-medium text-sm truncate">{doc.fileName}</p>
                        </div>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(doc.createdAt).toLocaleDateString('pt-BR')} • {(doc.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este documento?')) {
                              deleteDocument.mutate({ id: doc.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum documento anexado ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {caseClient ? (
                <div className="space-y-2">
                  <p className="font-medium">{caseClient.name}</p>
                  {caseClient.email && (
                    <p className="text-sm text-muted-foreground">{caseClient.email}</p>
                  )}
                  {caseClient.phone && (
                    <p className="text-sm text-muted-foreground">{caseClient.phone}</p>
                  )}
                  <Link href={`/clients/${caseClient.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Ver Perfil
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cliente não encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/chat/${caseId}`} className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat com Cliente
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const docsSection = document.querySelector('[data-documents-section]');
                  docsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Documentos
              </Button>
              <Link href="/agenda" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Agenda do Escritório
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowFeeForm(true)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Cadastrar Honorário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cadastro de Honorário */}
      {showFeeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Cadastrar Honorário</CardTitle>
              <CardDescription>
                Defina o valor e forma de pagamento do processo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="totalAmount">Valor Total (R$)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={feeForm.totalAmount}
                  onChange={(e) => setFeeForm({ ...feeForm, totalAmount: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="paymentType">Forma de Pagamento</Label>
                <Select
                  value={feeForm.paymentType}
                  onValueChange={(value: "cash" | "installments") => 
                    setFeeForm({ ...feeForm, paymentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">À Vista</SelectItem>
                    <SelectItem value="installments">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {feeForm.paymentType === "installments" && (
                <div>
                  <Label htmlFor="installmentsCount">Número de Parcelas</Label>
                  <Input
                    id="installmentsCount"
                    type="number"
                    min="2"
                    max="24"
                    value={feeForm.installmentsCount}
                    onChange={(e) => setFeeForm({ ...feeForm, installmentsCount: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="feeDescription">Descrição (opcional)</Label>
                <Textarea
                  id="feeDescription"
                  placeholder="Ex: Honorários advocatícios - Ação Trabalhista"
                  value={feeForm.description}
                  onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFeeForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const totalAmountCents = Math.round(parseFloat(feeForm.totalAmount) * 100);
                    const installmentsCount = parseInt(feeForm.installmentsCount);
                    
                    if (isNaN(totalAmountCents) || totalAmountCents <= 0) {
                      toast.error("Valor inválido");
                      return;
                    }
                    
                    if (feeForm.paymentType === "installments" && (isNaN(installmentsCount) || installmentsCount < 2)) {
                      toast.error("Número de parcelas inválido");
                      return;
                    }
                    
                    createFee.mutate({
                      caseId,
                      totalAmount: totalAmountCents,
                      paymentType: feeForm.paymentType,
                      installmentsCount: feeForm.paymentType === "installments" ? installmentsCount : 1,
                      description: feeForm.description || undefined,
                    });
                  }}
                  disabled={createFee.isPending}
                  className="flex-1"
                >
                  {createFee.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Adicionar Publicação Manual */}
      {showPublicationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Adicionar Publicação Manualmente</CardTitle>
              <CardDescription>
                Registre publicações do Diário de Justiça Eletrônico manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="movementType">Tipo de Movimentação *</Label>
                <Select
                  value={publicationForm.movementType}
                  onValueChange={(value) => setPublicationForm({ ...publicationForm, movementType: value })}
                >
                  <SelectTrigger id="movementType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Citação">Citação</SelectItem>
                    <SelectItem value="Audiência">Audiência</SelectItem>
                    <SelectItem value="Sentença">Sentença</SelectItem>
                    <SelectItem value="Despacho">Despacho</SelectItem>
                    <SelectItem value="Intimação">Intimação</SelectItem>
                    <SelectItem value="Julgamento">Julgamento</SelectItem>
                    <SelectItem value="Decisão">Decisão</SelectItem>
                    <SelectItem value="Recurso">Recurso</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="publishedAt">Data da Publicação *</Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={publicationForm.publishedAt}
                  onChange={(e) => setPublicationForm({ ...publicationForm, publishedAt: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo/Descrição *</Label>
                <Textarea
                  id="content"
                  placeholder="Cole aqui o texto da publicação do DJE..."
                  value={publicationForm.content}
                  onChange={(e) => setPublicationForm({ ...publicationForm, content: e.target.value })}
                  rows={8}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPublicationForm(false);
                    setPublicationForm({ movementType: "", publishedAt: new Date().toISOString().split('T')[0], content: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!publicationForm.movementType) {
                      toast.error("Tipo de movimentação é obrigatório");
                      return;
                    }
                    if (!publicationForm.content.trim()) {
                      toast.error("Conteúdo é obrigatório");
                      return;
                    }
                    
                    createPublication.mutate({
                      caseId,
                      movementType: publicationForm.movementType,
                      publishedAt: new Date(publicationForm.publishedAt),
                      content: publicationForm.content,
                    });
                  }}
                  disabled={createPublication.isPending}
                >
                  {createPublication.isPending ? "Adicionando..." : "Adicionar Publicação"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
