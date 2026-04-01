import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ClientInvoice from "./pages/ClientInvoice";
import InvoiceDetails from "./pages/InvoiceDetails";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";

function Router() {
  return (
    <Switch>
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/analytics"} component={AdminAnalytics} />
      <Route path={"/admin/settings"} component={AdminSettings} />
      <Route path={"/admin/invoice/:id"} component={InvoiceDetails} />
      <Route path={"/i/:slug"} component={ClientInvoice} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/"} component={AdminLogin} />
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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
