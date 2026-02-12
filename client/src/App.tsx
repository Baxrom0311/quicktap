import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import Home from "./pages/Home";

// Redirect component for /join/:code -> /?joinCode=:code
function JoinRedirect({ params }: { params: { code: string } }) {
  const [, setLocation] = useLocation();

  // Perform redirect immediately
  // We use window.location to ensure a full reload/clean state if needed, 
  // but wouter setLocation is usually enough for SPA. 
  // However, since Home mounts and checks query params, setLocation works.
  // Actually, we want to pass a query param. wouter doesn't support query params in setLocation directly (it's just a string).
  if (params?.code) {
    setLocation(`/?joinCode=${params.code}`);
  }

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/join/:code" component={JoinRedirect} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
