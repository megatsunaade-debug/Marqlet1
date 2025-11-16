import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export function ReminderWatcher() {
  const { isAuthenticated } = useAuth();
  const remindersQuery = trpc.tasks.reminders.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (remindersQuery.data && remindersQuery.data.length > 0) {
      remindersQuery.data.forEach(task => {
        const due = new Date(task.dueDate).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        toast.info(`Lembrete: ${task.title}`, {
          description: `Vence em ${due} · Prioridade ${task.priority}`,
          duration: 6000,
        });
      });
    }
  }, [remindersQuery.data]);

  return null;
}

