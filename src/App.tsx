import "./App.css";

export default function App() {
  return (
    <main className="app">
      <header>
        <p className="eyebrow">SupportDesk</p>
        <h1>Customer tickets</h1>
        <p>Manage customer requests and track their progress.</p>
      </header>

      <section className="panel" aria-labelledby="tickets-heading">
        <h2 id="tickets-heading">Tickets</h2>
        <p>No tickets yet. We’ll connect this screen to Convex next.</p>
      </section>
    </main>
  );
}