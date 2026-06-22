"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AccountPage() {
  const [mode, setMode]               = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm]               = useState({ name: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-5 py-20 pt-28">
      <div className="w-full max-w-sm">

        {/* Logo / brand */}
        <div className="text-center mb-10">
          <img src="/viale_logo_1.jpg" alt="Viale" className="h-8 object-contain mx-auto mb-6" />
          <h1 className="text-3xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[#6B6B6B] text-sm mt-2">
            {mode === "login"
              ? "Sign in to your Viale account."
              : "Join thousands of scent lovers."}
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

        {/* Form */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4"
        >
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full px-4 py-3.5 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3.5 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
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

          {mode === "login" && (
            <div className="text-right">
              <button type="button" className="text-[11px] text-[#6B6B6B] hover:text-[#111] transition-colors tracking-wide underline-offset-2 hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 w-full bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#333] transition-colors duration-200 font-medium"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[#E8E4DE]" />
          <span className="text-[11px] text-[#6B6B6B] tracking-widest">OR</span>
          <div className="flex-1 h-px bg-[#E8E4DE]" />
        </div>

        {/* Trust note */}
        <p className="text-center text-[11px] text-[#6B6B6B] leading-relaxed">
          By continuing you agree to our{" "}
          <span className="underline underline-offset-2 cursor-pointer hover:text-[#111] transition-colors">
            Terms
          </span>{" "}
          &amp;{" "}
          <span className="underline underline-offset-2 cursor-pointer hover:text-[#111] transition-colors">
            Privacy Policy
          </span>.
        </p>
      </div>
    </div>
  );
}
