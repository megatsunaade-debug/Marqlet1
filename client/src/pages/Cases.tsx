import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { PageNavigation } from "@/components/PageNavigation";

export default function Cases() {
  const { data: cases, isLoading } = trpc.cases.list.useQuery();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCases = cases?.filter(caseItem =>
    caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.court?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="container py-8">
      <PageNavigation />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Processos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os processos trabalhistas
          </p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Processo
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, número do processo ou vara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando processos...</p>
        </div>
      ) : filteredCases && filteredCases.length > 0 ? (
        <div className="grid gap-4">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {caseItem.title}
                      </CardTitle>
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
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {caseItem.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Criado em {new Date(caseItem.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {caseItem.filingDate && (
                      <span>
                        Ajuizado em {new Date(caseItem.filingDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchTerm ? "Nenhum processo encontrado" : "Nenhum processo cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Comece cadastrando seu primeiro processo"}
            </p>
            {!searchTerm && (
              <Link href="/cases/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Processo
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
