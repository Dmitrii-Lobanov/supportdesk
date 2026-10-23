import { useState } from "react";
import type { SubmitEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import TicketCard from "./components/TicketCard";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import Select from "./components/Select";
import type { Doc } from "../convex/_generated/dataModel";
import TicketDetailPage from "./pages/TicketDetailPage";
import "./styles/layout.css";
import "./styles/ticket-form.css";
import "./styles/ticket-filters.css";

function TicketListPage() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] =
    useState<NonNullable<Doc<"tickets">["priority"]>>("medium");

  const [statusFilter, setStatusFilter] = useState<
    Doc<"tickets">["status"] | "all"
  >("all");

  const tickets = useQuery(
    api.tickets.list,
    statusFilter === "all" ? {} : { status: statusFilter },
  );

  const createTicket = useMutation(api.tickets.create);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createTicket({ subject, description, priority });
      setPriority("medium");
      setSubject("");
      setDescription("");
    } catch (error) {
      setError(
        error instanceof ConvexError
          ? String(error.data)
          : "Could not create the ticket. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app">
      <header>
        <p className="eyebrow">SupportDesk</p>
        <h1>Customer tickets</h1>
        <p>Manage customer requests and track their progress.</p>
      </header>

      <section className="panel" aria-labelledby="create-heading">
        <h2 id="create-heading">Create a ticket</h2>

        <form className="ticket-form" onSubmit={handleSubmit}>
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={120}
            disabled={isSubmitting}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            rows={4}
            disabled={isSubmitting}
            required
          />

          <label htmlFor="priority">Priority</label>

          <Select
            id="priority"
            value={priority}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
            onValueChange={(value) => {
              if (value === "low" || value === "medium" || value === "high") {
                setPriority(value);
              }
            }}
            disabled={isSubmitting}
          />

          {error && <p role="alert">{error}</p>}

          <button
            className="button"
            type="submit"
            disabled={isSubmitting || !subject.trim() || !description.trim()}
          >
            {isSubmitting ? "Creating…" : "Create ticket"}
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="tickets-heading">
        <h2 id="tickets-heading">Latest tickets</h2>

        <div className="ticket-filters">
          <label htmlFor="status-filter">Filter by status</label>

          <Select
            id="status-filter"
            value={statusFilter}
            options={[
              { value: "all", label: "All statuses" },
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In progress" },
              { value: "resolved", label: "Resolved" },
            ]}
            onValueChange={(value) => {
              if (
                value === "all" ||
                value === "open" ||
                value === "in_progress" ||
                value === "resolved"
              ) {
                setStatusFilter(value);
              }
            }}
          />
        </div>

        {tickets === undefined ? (
          <p role="status">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <p>
            {statusFilter === "all"
              ? "No tickets yet. Create your first ticket above."
              : "No tickets match this status."}
          </p>
        ) : (
          <ul className="ticket-list">
            {tickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
