
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
  import { Toaster } from "./components/ui/sonner";

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </ErrorBoundary>
  );
  