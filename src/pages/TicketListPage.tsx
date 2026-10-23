import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import CreateTicketForm from "../components/CreateTicketForm";
import TicketCard from "../components/TicketCard";
import Select from "../components/Select";
import "../styles/ticket-filters.css";

type StatusFilter = Doc<"tickets">["status"] | "all";

export default function TicketListPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const tickets = useQuery(
    api.tickets.list,
    statusFilter === "all" ? {} : { status: statusFilter },
  );

  return (
    <main className="app">
      <header>
        <p className="eyebrow">SupportDesk</p>
        <h1>Customer tickets</h1>
        <p>Manage customer requests and track their progress.</p>
      </header>

      <section className="panel" aria-labelledby="create-heading">
        <h2 id="create-heading">Create a ticket</h2>
        <CreateTicketForm />
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
