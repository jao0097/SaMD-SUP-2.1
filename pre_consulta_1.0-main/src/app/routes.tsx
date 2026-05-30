import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Funcionarios } from "./pages/Funcionarios";
import { Consultas } from "./pages/Consultas";
import { Absenteismo } from "./pages/Absenteismo";
import { Sintomas } from "./pages/Sintomas";
import { Exportar } from "./pages/Exportar";
import { Configuracoes } from "./pages/Configuracoes";
import { Integracoes } from "./pages/Integracoes";
import { Auditoria } from "./pages/Auditoria";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "funcionarios", Component: Funcionarios },
      { path: "consultas", Component: Consultas },
      { path: "absenteismo", Component: Absenteismo },
      { path: "sintomas", Component: Sintomas },
      { path: "exportar", Component: Exportar },
      { path: "configuracoes", Component: Configuracoes },
      { path: "integracoes", Component: Integracoes },
      { path: "auditoria", Component: Auditoria },
    ],
  },
], {
  basename: "/admin"
});
