import { useState } from "react";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import type { Doc } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import "./CustomerPanel.css";

type Customer = NonNullable<
  FunctionReturnType<typeof api.customers.getForTicket>
>;

type CustomerPanelProps = {
  ticket: Doc<"tickets">;
};

export default function CustomerPanel({ ticket }: CustomerPanelProps) {
  const getCustomer = useAction(api.customers.getForTicket);

  const [customer, setCustomer] = useState<Customer | null | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCustomer() {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setCustomer(undefined);

    try {
      const result = await getCustomer({ ticketId: ticket._id });
      setCustomer(result);
    } catch (error) {
      setError(
        error instanceof ConvexError
          ? String(error.data)
          : "Could not load the customer. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="customer-panel" aria-label="Customer">
      <h2>Customer</h2>

      {!ticket.customerId ? (
        <p>No customer linked to this ticket.</p>
      ) : (
        <>
          <p>
            Customer ID: <code>{ticket.customerId}</code>
          </p>

          {isLoading && <p role="status">Loading customer…</p>}

          {customer === null && <p>The linked customer could not be found.</p>}

          {customer && (
            <dl className="customer-details">
              <div>
                <dt>Name</dt>
                <dd>{customer.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{customer.email}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{customer.plan}</dd>
              </div>
            </dl>
          )}

          {error && <p role="alert">{error}</p>}

          <button
            className="customer-load-button"
            type="button"
            onClick={() => {
              void loadCustomer();
            }}
            disabled={isLoading}
          >
            {isLoading
              ? "Loading…"
              : error
                ? "Retry"
                : customer !== undefined
                  ? "Refresh customer"
                  : "Load customer"}
          </button>
        </>
      )}
    </section>
  );
}
