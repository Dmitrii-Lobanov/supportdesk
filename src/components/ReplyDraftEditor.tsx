import { useId, useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Props = {
  jobId: Id<"jobs">;
  suggestedDraft: string;
  savedDraft?: string;
  revision: number;
};

export default function ReplyDraftEditor({
  jobId,
  suggestedDraft,
  savedDraft,
  revision,
}: Props) {
  const inputId = useId();
  const saveDraft = useMutation(api.jobs.saveDraft);

  const [text, setText] = useState(savedDraft ?? suggestedDraft);
  const [localRevision, setLocalRevision] = useState(revision);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasNewerVersion = revision > localRevision;

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    setMessage("");
    setError(null);

    try {
      const nextRevision = await saveDraft({
        jobId,
        text,
        expectedRevision: localRevision,
      });

      setLocalRevision(nextRevision);
      setMessage("Draft saved.");
    } catch (error) {
      setError(
        error instanceof ConvexError
          ? String(error.data)
          : "Could not save the draft. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function loadLatest() {
    setText(savedDraft ?? suggestedDraft);
    setLocalRevision(revision);
    setError(null);
    setMessage("Latest saved draft loaded.");
  }

  return (
    <div className="reply-editor">
      <label htmlFor={inputId}>Your reply draft</label>
      <textarea
        id={inputId}
        rows={10}
        maxLength={3000}
        value={text}
        disabled={isSaving}
        onChange={(event) => {
          setText(event.target.value);
          setMessage("");
        }}
      />

      <p>Saving stores a draft. It does not send a reply.</p>

      {hasNewerVersion && (
        <p role="status">
          A newer saved draft is available. Copy any edits you want to keep
          before loading it.
        </p>
      )}

      {error && <p role="alert">{error}</p>}
      <p role="status">{message}</p>

      <div className="reply-editor-actions">
        <button
          className="analysis-button"
          type="button"
          disabled={isSaving || !text.trim() || hasNewerVersion}
          onClick={() => {
            void handleSave();
          }}
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>

        {hasNewerVersion && (
          <button
            className="analysis-button"
            type="button"
            disabled={isSaving}
            onClick={loadLatest}
          >
            Load latest saved draft
          </button>
        )}
      </div>
    </div>
  );
}
