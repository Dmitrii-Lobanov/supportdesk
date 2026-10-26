import { useState } from "react";
import type { SubmitEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import Select from "./Select";
import "../styles/ticket-form.css";

export default function CreateTicketForm() {
  const createTicket = useMutation(api.tickets.create);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<NonNullable<Doc<"tickets">["priority"]>>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createTicket({ subject, description, priority, customerId });
      setSubject("");
      setDescription("");
      setPriority("medium");
      setCustomerId("");
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
    <form className="ticket-form" onSubmit={handleSubmit}>
      <label htmlFor="customer-id">Customer ID</label>
      <input
        id="customer-id"
        value={customerId}
        onChange={(event) => setCustomerId(event.target.value)}
        placeholder="cus_001"
        maxLength={68}
        pattern="cus_[a-zA-Z0-9_-]{1,64}"
        title="Use cus_ followed by 1–64 letters, numbers, underscores, or hyphens."
        disabled={isSubmitting}
        required
      />

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
        disabled={
          isSubmitting ||
          !subject.trim() ||
          !description.trim() ||
          !customerId.trim()
        }
      >
        {isSubmitting ? "Creating…" : "Create ticket"}
      </button>
    </form>
  );
}
