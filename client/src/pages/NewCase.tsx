import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { PageNavigation } from "@/components/PageNavigation";

export default function NewCase() {
  const [, setLocation] = useLocation();
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();
  
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    description: "",
    processNumber: "",
    court: "",
    filingDate: "",
  });

  const createCase = trpc.cases.create.useMutation({
    onSuccess: () => {
      toast.success("Processo cadastrado com sucesso!");
      setLocation("/cases");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar processo: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    createCase.mutate({
      clientId: parseInt(formData.clientId),
      title: formData.title,
      description: formData.description || undefined,
      processNumber: formData.processNumber || undefined,
      court: formData.court || undefined,
      filingDate: formData.filingDate ? new Date(formData.filingDate) : undefined,
    });
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Dashboard
        </Button>
      </Link>
      <PageNavigation />

      <Card>
        <CardHeader>
          <CardTitle>Novo Processo Trabalhista</CardTitle>
          <CardDescription>
            Cadastre um novo processo para acompanhamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente *</Label>
              {loadingClients ? (
                <p className="text-sm text-muted-foreground">Carregando clientes...</p>
              ) : clients && clients.length > 0 ? (
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Nenhum cliente cadastrado.{" "}
                  <Link href="/clients/new" className="text-primary underline">
                    Cadastre um cliente primeiro
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Processo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Rescisão Indireta - Horas Extras"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processNumber">Número do Processo</Label>
              <Input
                id="processNumber"
                value={formData.processNumber}
                onChange={(e) => setFormData({ ...formData, processNumber: e.target.value })}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="court">Vara/Tribunal</Label>
              <Input
                id="court"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                placeholder="Ex: 1ª Vara do Trabalho de São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filingDate">Data de Ajuizamento</Label>
              <Input
                id="filingDate"
                type="date"
                value={formData.filingDate}
                onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva os detalhes do processo..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createCase.isPending || !clients || clients.length === 0}
                className="flex-1"
              >
                {createCase.isPending ? "Cadastrando..." : "Cadastrar Processo"}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
