"use client";

import { useState, useActionState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp, signInWithGoogle, type AuthFormState } from "@/app/actions/auth";
import Logo from "@/components/layout/Logo";

const initialState: AuthFormState = {};

export default function AuthPanel({
  redirectTo,
  oauthError,
}: {
  redirectTo?: string;
  oauthError?: string;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [loginState, loginAction] = useActionState(signIn, initialState);
  const [signupState, signupAction] = useActionState(signUp, initialState);

  const state = mode === "login" ? loginState : signupState;
  const action = mode === "login" ? loginAction : signupAction;

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-5 py-20 pt-28">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="mb-6">
            <Logo variant="dark" />
          </div>
          <h1 className="text-3xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[#6B6B6B] text-sm mt-2">
            {mode === "login" ? "Sign in to your Viale account." : "Join thousands of scent lovers."}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex border border-[#E8E4DE] mb-8">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-3 text-[11px] tracking-[0.15em] uppercase font-medium transition-colors ${
              mode === "login" ? "bg-[#111] text-white" : "text-[#6B6B6B] hover:text-[#111]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-3 text-[11px] tracking-[0.15em] uppercase font-medium transition-colors ${
              mode === "signup" ? "bg-[#111] text-white" : "text-[#6B6B6B] hover:text-[#111]"
            }`}
          >
            Register
          </button>
        </div>

        {/* Feedback */}
        {(state?.error || oauthError) && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {state?.error || oauthError}
          </div>
        )}
        {state?.message && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm">
            {state.message}
          </div>
        )}

        {/* Google */}
        <form action={signInWithGoogle}>
          <input type="hidden" name="redirectTo" value={redirectTo ?? "/"} />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 border border-[#E8E4DE] bg-white py-3.5 text-[12px] tracking-[0.08em] text-[#111] font-medium hover:border-[#111] transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-7">
          <div className="flex-1 h-px bg-[#E8E4DE]" />
          <span className="text-[11px] text-[#6B6B6B] tracking-widest">OR</span>
          <div className="flex-1 h-px bg-[#E8E4DE]" />
        </div>

        {/* Email form */}
        <form
          action={(formData) => startTransition(() => action(formData))}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="redirectTo" value={redirectTo ?? "/"} />

          {mode === "signup" && (
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="Jane Doe"
                className="w-full px-4 py-3.5 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3.5 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                className="w-full px-4 py-3.5 pr-12 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#111] transition-colors"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#333] transition-colors duration-200 font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#6B6B6B] leading-relaxed mt-8">
          By continuing you agree to our{" "}
          <span className="underline underline-offset-2 cursor-pointer hover:text-[#111] transition-colors">Terms</span>{" "}
          &amp;{" "}
          <span className="underline underline-offset-2 cursor-pointer hover:text-[#111] transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
