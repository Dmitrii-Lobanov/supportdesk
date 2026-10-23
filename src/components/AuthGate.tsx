import type { ReactNode } from "react";
import { SignInButton, UserButton } from "@clerk/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import "./AuthGate.css";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  return (
    <>
      <AuthLoading>
        <main className="app">
          <p role="status">Checking your session…</p>
        </main>
      </AuthLoading>

      <Unauthenticated>
        <main className="app">
          <section className="panel auth-panel">
            <p className="eyebrow">SupportDesk</p>
            <h1>Your support workspace</h1>
            <p>Sign in to manage customer tickets.</p>

            <SignInButton mode="modal">
              <button className="sign-in-button" type="button">
                Sign in
              </button>
            </SignInButton>
          </section>
        </main>
      </Unauthenticated>

      <Authenticated>
        <div className="account-bar">
          <span>SupportDesk workspace</span>
          <UserButton />
        </div>

        {children}
      </Authenticated>
    </>
  );
}
