import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import "./App.css";

export default function App() {
  const tickets = useQuery(api.tickets.list);
  const createTicket = useMutation(api.tickets.create);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createTicket({ subject, description });
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

        <form onSubmit={handleSubmit}>
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

          {error && <p role="alert">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !subject.trim() || !description.trim()}
          >
            {isSubmitting ? "Creating…" : "Create ticket"}
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="tickets-heading">
        <h2 id="tickets-heading">Latest tickets</h2>

        {tickets === undefined ? (
          <p role="status">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <p>No tickets yet. Create your first ticket above.</p>
        ) : (
          <ul className="ticket-list">
            {tickets.map((ticket) => (
              <li key={ticket._id} className="ticket">
                <h3>{ticket.subject}</h3>
                <p className="ticket-description">{ticket.description}</p>
                <span className="badge">{ticket.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
