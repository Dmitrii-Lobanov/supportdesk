import { useState } from "react";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import "./CustomerPicker.css";

type Customer = FunctionReturnType<typeof api.customers.search>[number];

type CustomerPickerProps = {
  value: string;
  onChange: (customerId: string) => void;
  disabled: boolean;
};

export default function CustomerPicker({
  value,
  onChange,
  disabled,
}: CustomerPickerProps) {
  const searchCustomers = useAction(api.customers.search);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    if (isSearching || disabled) return;

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      setResults(await searchCustomers({ search }));
    } catch (error) {
      setError(
        error instanceof ConvexError
          ? String(error.data)
          : "Could not search customers. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <fieldset className="customer-picker" disabled={disabled}>
      <legend>Customer</legend>

      <label className="customer-choice">
        <input
          type="radio"
          name="customer"
          checked={value === ""}
          onChange={() => onChange("")}
        />
        <span>No customer linked</span>
      </label>

      <label htmlFor="customer-search">Find a customer</label>
      <div className="customer-search">
        <input
          id="customer-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          maxLength={100}
          disabled={isSearching}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void runSearch();
            }
          }}
        />

        <button
          className="customer-search-button"
          type="button"
          onClick={() => {
            void runSearch();
          }}
          disabled={isSearching}
        >
          {isSearching ? "Searching…" : "Search"}
        </button>
      </div>

      {isSearching && <p role="status">Searching customers…</p>}
      {error && <p role="alert">{error}</p>}

      {results?.length === 0 && <p role="status">No matching customers.</p>}

      {results && results.length > 0 && (
        <ul className="customer-results">
          {results.map((customer) => (
            <li key={customer.id}>
              <label className="customer-choice">
                <input
                  type="radio"
                  name="customer"
                  checked={value === customer.id}
                  onChange={() => onChange(customer.id)}
                />
                <span>
                  <strong>{customer.name}</strong>
                  <span className="customer-choice-email">
                    {customer.email}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <p className="customer-selection" role="status">
        {value
          ? `Selected customer: ${value}`
          : "This ticket will be unlinked."}
      </p>
    </fieldset>
  );
}
