import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import NewClient from "./pages/NewClient";
import ClientDetail from "./pages/ClientDetail";
import Cases from "./pages/Cases";
import NewCase from "./pages/NewCase";
import CaseDetail from "./pages/CaseDetail";
import ClientPortal from "./pages/ClientPortal";
import Chat from "./pages/Chat";
import Financial from "./pages/Financial";
import Publications from "./pages/Publications";
import FAQ from "./pages/FAQ";
import Agenda from "./pages/Agenda";
import { ReminderWatcher } from "@/components/ReminderWatcher";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/login" component={Login} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/new" component={NewClient} />
      <Route path="/clients/:id" component={ClientDetail} />
      <Route path="/cases" component={Cases} />
      <Route path="/cases/new" component={NewCase} />
      <Route path="/cases/:id" component={CaseDetail} />
      <Route path="/portal/:token" component={ClientPortal} />
      <Route path="/chat/:caseId" component={Chat} />
      <Route path="/chat" component={Chat} />
      <Route path="/financial" component={Financial} />
      <Route path="/publications" component={Publications} />
      <Route path="/agenda" component={Agenda} />
      <Route path="/faq" component={FAQ} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <ReminderWatcher />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
