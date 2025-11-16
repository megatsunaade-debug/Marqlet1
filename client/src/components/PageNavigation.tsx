import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Briefcase, CalendarClock, DollarSign, Bell, Book, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMemo } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/clients", icon: Users },
  { label: "Processos", href: "/cases", icon: Briefcase },
  { label: "Agenda", href: "/agenda", icon: CalendarClock },
  { label: "Financeiro", href: "/financial", icon: DollarSign },
  { label: "Publicações", href: "/publications", icon: Bell },
  { label: "FAQ", href: "/faq", icon: Book },
  { label: "Mensagens", href: "/chat", icon: MessageSquare },
];

type PageNavigationProps = {
  showBack?: boolean;
};

export function PageNavigation({ showBack = true }: PageNavigationProps) {
  const [location] = useLocation();

  const grouped = useMemo(() => navItems.slice(), []);

  return (
    <div className="flex flex-col gap-3 mb-6">
      {showBack && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/dashboard";
              }
            }}
          >
            Voltar
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {grouped.map(item => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

