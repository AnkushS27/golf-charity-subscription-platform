import { signInAction } from "@/app/actions/auth";
import { PendingSubmitButton } from "@/app/components/pending-submit-button";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    signup?: string;
    next?: string;
  }>;
};

function isSafeNextPath(value: string | undefined) {
  return !!value && value.startsWith("/");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextPath = isSafeNextPath(params?.next) ? params?.next : "/dashboard";

  const statusMessage =
    params?.signup === "check-email"
      ? "Account created. You can sign in now."
        : null;

  const errorMessage =
    params?.error === "invalid_input"
      ? "Please provide valid credentials."
      : params?.error === "invalid_credentials"
        ? "Sign in failed. Check your email/password."
          : null;

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Log in</h1>

      {statusMessage && (
        <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{statusMessage}</p>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errorMessage}</p>
      )}

      <form action={signInAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block">
          <span className="mb-1 block text-sm">Email</span>
          <input name="email" type="email" required className="w-full rounded-lg border border-black/15 px-4 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Password</span>
          <input
            name="password"
            type="password"
            minLength={6}
            required
            className="w-full rounded-lg border border-black/15 px-4 py-2"
          />
        </label>
        <PendingSubmitButton type="submit" pendingLabel="Signing in..." className="w-full rounded-lg bg-black px-4 py-2 text-white">
          Continue
        </PendingSubmitButton>
      </form>
    </main>
  );
}
