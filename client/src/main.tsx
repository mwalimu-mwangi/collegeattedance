import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { ModalProvider } from "./context/modal-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </AuthProvider>
  </QueryClientProvider>
);
