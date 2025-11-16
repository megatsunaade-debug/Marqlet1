import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      window.location.href = "/dashboard";
    },
    onError: err => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Cadastro realizado! Faça login para continuar.");
      setMode("login");
    },
    onError: err => toast.error(err.message),
  });

  if (isAuthenticated) {
    window.location.href = "/dashboard";
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ email: form.email, password: form.password });
    } else {
      registerMutation.mutate({
        name: form.name,
        email: form.email,
        password: form.password,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#eff6ff,_#fdf6ee)] px-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-100">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={APP_LOGO} alt="Logo" className="h-12 w-12 object-contain" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            {mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Entre para gerenciar seus clientes e processos."
              : "Informe seus dados para começar a usar o painel."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome completo</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Maria Advogada"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="voce@escritorio.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Senha</label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="w-full"
            >
              {mode === "login"
                ? loginMutation.isPending
                  ? "Entrando..."
                  : "Entrar"
                : registerMutation.isPending
                  ? "Cadastrando..."
                  : "Criar conta"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === "login" ? "Não tem conta?" : "Já possui conta?"}{" "}
            <button
              className="text-primary font-medium"
              onClick={() =>
                setMode(prev => (prev === "login" ? "register" : "login"))
              }
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

