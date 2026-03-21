import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6">
      <AuthForm mode="login" />
      <p className="mt-4 text-sm text-zinc-400">
        New to Signal? <Link href="/signup">Create an account</Link>
      </p>
    </main>
  );
}
