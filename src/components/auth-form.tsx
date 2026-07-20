"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/actions/auth";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  requireInvite?: boolean;
};

export function AuthForm({ mode, action, requireInvite }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const isSignup = mode === "signup";

  return (
    <div className="flex h-full flex-1 flex-col justify-center overflow-hidden px-5 py-10">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        {isSignup ? "Sign up" : "Log in"}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Shared todos for you and your friend.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="block">
          <span className="mb-2 block text-sm text-gray-500">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-gray-500">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        {isSignup && requireInvite ? (
          <label className="block">
            <span className="mb-2 block text-sm text-gray-500">Invite code</span>
            <input
              name="inviteCode"
              type="text"
              required
              placeholder="Ask your friend for the code"
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        ) : null}

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">
            {state.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-2xl bg-blue-500 py-3.5 text-base font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
        >
          {isPending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-500">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-blue-500">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
