import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6">
      <AuthForm mode="signup" />
      <p className="mt-4 text-sm text-zinc-400">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
