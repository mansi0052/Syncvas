import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { useThemeStore } from "./store/useThemeStore";

function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);
  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    html.classList.add(theme);
  }, [theme]);

  // Initial sync (in case store loads late)
  React.useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("dark") && !html.classList.contains("light")) {
      html.classList.add(theme);
    }
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeInitializer />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
