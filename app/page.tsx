import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-semibold">Signal</h1>
      <p className="max-w-xl text-zinc-300">A minimal daily edge for builders, investors, and high performers.</p>
      <div className="flex gap-3">
        <Link className="rounded bg-white px-4 py-2 text-black" href="/signup">
          Get started
        </Link>
        <Link className="rounded border border-zinc-700 px-4 py-2" href="/login">
          Log in
        </Link>
      </div>
    </main>
  );
}
