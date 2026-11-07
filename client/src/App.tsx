import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TopBar } from "./components/TopBar";
import { VoiceProvider } from "./lib/voice";
import { ConversationProvider } from "./state/ConversationContext";
import Home from "./pages/Home";
import Scenarios from "./pages/Scenarios";
import Simulation from "./pages/Simulation";
import Evaluation from "./pages/Evaluation";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/scenarier"} component={Scenarios} />
      <Route path={"/ovelse/:id"} component={Simulation} />
      <Route path={"/evaluering"} component={Evaluation} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <VoiceProvider>
          <ConversationProvider>
            <TooltipProvider>
              <Toaster />
              <div className="flex min-h-dvh flex-col bg-page">
                <TopBar />
                <main className="flex-1">
                  <Router />
                </main>
              </div>
            </TooltipProvider>
          </ConversationProvider>
        </VoiceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
