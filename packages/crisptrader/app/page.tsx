import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-stone-900 to-stone-800 text-white px-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <svg
            className="w-10 h-10 text-amber-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h1 className="text-4xl font-bold tracking-tight">Crisp Trader</h1>
        </div>

        <div className="space-y-3">
          <p className="text-xl text-amber-300 font-medium">
            Get emailed the moment gold or silver hits your price.
          </p>
          <p className="text-lg text-stone-300">
            No noise. No dashboard to check. Just the alert.
          </p>
        </div>

        <Link
          href="/sign-up"
          className="inline-block mt-4 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold rounded-lg transition-colors"
        >
          Set your first alert →
        </Link>

        <div className="pt-8 flex items-center justify-center gap-6 text-sm text-stone-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Gold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-stone-300" />
            <span>Silver</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-stone-200" />
            <span>Platinum</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-stone-500" />
            <span>Palladium</span>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 text-stone-500 text-sm">
        Free to start. $9/mo for serious stackers.
      </footer>
    </main>
  );
}