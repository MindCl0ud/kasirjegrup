import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/figtree";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
// Hide splash screen after React mounts
if (window.__hideSplash) {
  setTimeout(window.__hideSplash, 300);
}
