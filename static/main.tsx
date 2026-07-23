import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../app/globals.css";
import { StudyCockpit } from "../app/StudyCockpit";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <StudyCockpit />
  </StrictMode>,
);
