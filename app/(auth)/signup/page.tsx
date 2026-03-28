import { signUpAction } from "@/app/actions/auth";
import { PendingSubmitButton } from "@/app/components/pending-submit-button";

type SignupPageProps = {
  searchParams?: Promise<{
    error?: string;
    field?: string;
    reason?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const invalidField = params?.field;

  const errorMessage =
    params?.error === "invalid_input"
      ? invalidField === "fullName"
        ? "Full name must be at least 2 characters."
        : invalidField === "email"
          ? "Please enter a valid email address."
          : invalidField === "password"
            ? "Password must be at least 6 characters."
            : "Please enter a full name (at least 2 characters), a valid email, and a password with at least 6 characters."
      : params?.error === "signup_failed"
        ? `Sign up failed. ${params?.reason ? `Reason: ${params.reason}` : "Please check your input and try again."}`
        : params?.error === "no_user_created"
          ? "No user account was created. Please try again."
          : null;

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Create account</h1>

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errorMessage}</p>
      )}

      <form action={signUpAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">Full name</span>
          <input name="fullName" required className="w-full rounded-lg border border-black/15 px-4 py-2" />
        </label>
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
        <PendingSubmitButton type="submit" pendingLabel="Creating account..." className="w-full rounded-lg bg-black px-4 py-2 text-white">
          Create account
        </PendingSubmitButton>
      </form>
    </main>
  );
}
