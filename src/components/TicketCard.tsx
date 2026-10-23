import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router";
import type { Doc } from "../../convex/_generated/dataModel";

type TicketCardProps = {
  ticket: Doc<"tickets">;
};

const statusLabels = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
} satisfies Record<Doc<"tickets">["status"], string>;

function isTicketStatus(value: string): value is Doc<"tickets">["status"] {
  return value === "open" || value === "in_progress" || value === "resolved";
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const updateStatus = useMutation(api.tickets.updateStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(value: string) {
    if (!isTicketStatus(value) || isUpdating) return;

    setIsUpdating(true);
    setError(null);

    try {
      await updateStatus({
        ticketId: ticket._id,
        status: value,
      });
    } catch (error) {
      setError(
        error instanceof ConvexError
          ? String(error.data)
          : "Could not update the status. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <li className="ticket">
      <h3>
        <Link className="ticket-link" to={`/tickets/${ticket._id}`}>
          {ticket.subject}
        </Link>
      </h3>
      <p className="ticket-description">{ticket.description}</p>

      <p>
        Created:{" "}
        <time dateTime={new Date(ticket._creationTime).toISOString()}>
          {new Date(ticket._creationTime).toLocaleString()}
        </time>
      </p>

      <div className="ticket-controls">
        <span className={`badge badge--${ticket.status}`}>
          {statusLabels[ticket.status]}
        </span>

        <label className="status-control">
          <span>Status</span>
          <select
            value={ticket.status}
            onChange={(event) => {
              void handleStatusChange(event.target.value);
            }}
            disabled={isUpdating}
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>

        {isUpdating && <span role="status">Saving…</span>}
      </div>

      {error && <p role="alert">{error}</p>}
    </li>
  );
}
