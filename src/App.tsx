import { BrowserRouter, Link, Route, Routes } from "react-router";
import TicketListPage from "./pages/TicketListPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import AuthGate from "./components/AuthGate";
import WorkspaceGate from "./components/WorkspaceGate";
import "./styles/layout.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <WorkspaceGate>
          <Routes>
            <Route path="/" element={<TicketListPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route
              path="*"
              element={
                <main className="app">
                  <h1>Page not found</h1>
                  <p>
                    <Link to="/">Return to tickets</Link>
                  </p>
                </main>
              }
            />
          </Routes>
        </WorkspaceGate>
      </AuthGate>
    </BrowserRouter>
  );
}
