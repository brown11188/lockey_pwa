"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import {
  Loader as LoaderIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
} from "lucide-react";

type AuthMode = "login" | "register" | "reset-password";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const titles: Record<AuthMode, string> = {
    login: t.auth.login,
    register: t.auth.register,
    "reset-password": t.auth.resetPassword,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError(t.auth.passwordMinLength);
      return;
    }

    if ((mode === "register" || mode === "reset-password") && password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const result = await signIn("credentials", {
          email: email.toLowerCase(),
          password,
          redirect: false,
        });
        if (result?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/gallery");
          router.refresh();
        }
      } else if (mode === "register") {
        const res = await apiFetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed");
        } else {
          setSuccess(t.auth.registerSuccess);
          setTimeout(() => router.push("/login"), 1500);
        }
      } else {
        const res = await apiFetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Reset failed");
        } else {
          setSuccess(t.auth.resetSuccess);
          setTimeout(() => router.push("/login"), 1500);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = () => {
    if (loading) {
      if (mode === "login") return t.auth.loggingIn;
      if (mode === "register") return t.auth.registering;
      return t.auth.resetting;
    }
    if (mode === "login") return t.auth.loginButton;
    if (mode === "register") return t.auth.registerButton;
    return t.auth.resetButton;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-3xl font-black text-gray-950 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          L
        </div>
        <h1 className="text-2xl font-bold text-white">Lockey</h1>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-center text-xl font-bold text-white">
          {titles[mode]}
        </h2>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">
              {t.auth.email}
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPlaceholder}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">
              {mode === "reset-password" ? t.auth.newPassword : t.auth.password}
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "reset-password"
                    ? t.auth.newPasswordPlaceholder
                    : t.auth.passwordPlaceholder
                }
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password (register + reset) */}
          {(mode === "register" || mode === "reset-password") && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-400">
                {t.auth.confirmPassword}
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-gray-950 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <LoaderIcon className="h-4 w-4 animate-spin" />}
            {buttonLabel()}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3 text-center text-sm">
          {mode === "login" && (
            <>
              <p className="text-gray-500">
                {t.auth.noAccount}{" "}
                <Link
                  href="/register"
                  className="font-medium text-amber-400 hover:text-amber-300"
                >
                  {t.auth.register}
                </Link>
              </p>
              <p>
                <Link
                  href="/reset-password"
                  className="text-gray-500 hover:text-gray-300"
                >
                  {t.auth.forgotPassword}
                </Link>
              </p>
            </>
          )}
          {mode === "register" && (
            <p className="text-gray-500">
              {t.auth.haveAccount}{" "}
              <Link
                href="/login"
                className="font-medium text-amber-400 hover:text-amber-300"
              >
                {t.auth.login}
              </Link>
            </p>
          )}
          {mode === "reset-password" && (
            <p>
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-300"
              >
                {t.auth.backToLogin}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
