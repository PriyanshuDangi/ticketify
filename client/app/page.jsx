export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">
          Welcome to Ticketify
        </h1>
        <p className="text-xl text-center text-muted-foreground">
          Blockchain-based event ticketing with PYUSD
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Browse Events
          </button>
          <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
            Create Event
          </button>
        </div>
      </div>
    </main>
  )
}

