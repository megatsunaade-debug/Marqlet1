import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlarmClock, CalendarDays, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageNavigation } from "@/components/PageNavigation";
import { useState } from "react";

export default function Agenda() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const { data: tasks, isLoading, refetch } = trpc.tasks.upcoming.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: cases } = trpc.cases.list.useQuery(undefined, { enabled: isAuthenticated });
  const [form, setForm] = useState({
    caseId: "",
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    reminderMinutesBefore: "60",
  });
  const updateTaskStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Lembrete atualizado");
      refetch();
    },
    onError: err => toast.error(err.message),
  });
  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Lembrete criado!");
      setForm({
        caseId: "",
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        reminderMinutesBefore: "60",
      });
      refetch();
    },
    onError: err => toast.error(err.message),
  });

  const grouped = (tasks ?? []).reduce<Record<string, typeof tasks>>((acc, task) => {
    const key = new Date(task.dueDate).toLocaleDateString("pt-BR");
    acc[key] = acc[key] ?? [];
    acc[key]!.push(task);
    return acc;
  }, {});

  const renderBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-emerald-100 text-emerald-700">Concluído</Badge>;
    if (status === "in_progress") return <Badge className="bg-blue-100 text-blue-700">Em andamento</Badge>;
    return <Badge className="bg-amber-100 text-amber-700">Pendente</Badge>;
  };

  return (
    <div className="container py-8 max-w-5xl">
      <PageNavigation />
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          Agenda do Escritório
        </h1>
        <p className="text-muted-foreground">
          Veja os próximos compromissos e lembretes vinculados aos processos. Os itens aparecem até 14 dias antes da data.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo lembrete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Processo *</Label>
              <Select
                value={form.caseId}
                onValueChange={value => setForm(prev => ({ ...prev, caseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um processo" />
                </SelectTrigger>
                <SelectContent>
                  {cases?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.title} {c.processNumber ? `- ${c.processNumber}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data e hora *</Label>
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Protocolar contestação"
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={value => setForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Lembrete (min. antes)</Label>
              <Input
                type="number"
                min={5}
                value={form.reminderMinutesBefore}
                onChange={e => setForm(prev => ({ ...prev, reminderMinutesBefore: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes do que deve ser feito"
              rows={3}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                if (!form.caseId || !form.title.trim() || !form.dueDate) {
                  toast.error("Preencha processo, título e data");
                  return;
                }
                createTask.mutate({
                  caseId: parseInt(form.caseId, 10),
                  title: form.title,
                  description: form.description || undefined,
                  dueDate: new Date(form.dueDate),
                  priority: form.priority as "low" | "medium" | "high",
                  reminderMinutesBefore: parseInt(form.reminderMinutesBefore, 10) || 60,
                });
              }}
              disabled={createTask.isPending || !cases || cases.length === 0}
            >
              {createTask.isPending ? "Salvando..." : "Criar lembrete"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setForm({
                  caseId: "",
                  title: "",
                  description: "",
                  dueDate: "",
                  priority: "medium",
                  reminderMinutesBefore: "60",
                })
              }
            >
              Limpar
            </Button>
          </div>
          {!cases || cases.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">
              Cadastre um processo para criar lembretes.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando compromissos...</p>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>{date}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items!.map(task => (
                  <div key={task.id} className="border rounded-xl p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlarmClock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{task.title}</span>
                        {renderBadge(task.status)}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Lembrete {task.reminderMinutesBefore} min antes · Prioridade {task.priority}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {task.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: "completed" })}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum lembrete futuro. Adicione atividades dentro dos processos para vê-las aqui.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
