import { useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import TicketCard from "../components/TicketCard";
import CustomerPanel from "../components/CustomerPanel";
import "./TicketDetailPage.css";

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();

  const ticket = useQuery(api.tickets.get, ticketId ? { ticketId } : "skip");

  return (
    <main className="app">
      <header>
        <Link className="back-link" to="/">
          ← Back to tickets
        </Link>
        <h1>Ticket details</h1>
        <p>Review this request and update its status.</p>
      </header>

      <section className="panel" aria-label="Ticket details">
        {!ticketId || ticket === null ? (
          <p>Ticket not found. Check the link or return to the ticket list.</p>
        ) : ticket === undefined ? (
          <p role="status">Loading ticket…</p>
        ) : (
          <>
            <ul className="ticket-list">
              <TicketCard key={ticket._id} ticket={ticket} />
            </ul>

            <CustomerPanel
              key={`${ticket._id}:${ticket.customerId ?? "none"}`}
              ticket={ticket}
            />
          </>
        )}
      </section>
    </main>
  );
}
