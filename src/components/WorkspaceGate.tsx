import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type WorkspaceGateProps = {
  children: ReactNode;
};

export default function WorkspaceGate({ children }: WorkspaceGateProps) {
  const membership = useQuery(api.memberships.current);

  if (membership === undefined) {
    return (
      <main className="app">
        <p role="status">Checking workspace access…</p>
      </main>
    );
  }

  if (membership === null) {
    return (
      <main className="app">
        <section className="panel">
          <h1>Workspace access required</h1>
          <p>
            You are signed in, but you have not been added to this workspace.
            Contact the workspace administrator.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
