"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/http";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft as ArrowLeftIcon,
  Trash2 as Trash2Icon,
  DollarSign as DollarSignIcon,
  Globe as GlobeIcon,
  Info as InfoIcon,
  LogOut as LogOutIcon,
  User as UserIcon,
  Trophy as TrophyIcon,
  Download as DownloadIcon,
} from "lucide-react";
import { AchievementsSection } from "@/components/achievements-section";

export function SettingsScreen() {
  const { currency, setCurrency } = useCurrency();
  const { locale, setLocale, t } = useLanguage();
  const { data: session } = useSession();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [clearError, setClearError] = useState("");
  const router = useRouter();

  const handleClearAll = async () => {
    setClearing(true);
    setClearError("");
    try {
      const res = await apiFetch("/api/settings/clear", { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, t.settings.clearFailed));
      }
      setClearConfirm(false);
      router.push("/gallery");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : t.settings.clearFailed;
      setClearError(message);
      console.error("Failed to clear data", err);
    } finally {
      setClearing(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 backdrop-blur-lg safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold text-white">{t.settings.title}</h1>
        </div>
      </div>

      <div className="px-4 pt-6">
        {/* Account Info */}
        {session?.user && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <UserIcon className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">
                  {session.user.name || session.user.email}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Currency Toggle */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <DollarSignIcon className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{t.settings.currency}</h3>
              <p className="text-sm text-gray-500">
                {t.settings.currencyDesc}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {(["VND", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`flex-1 rounded-xl border py-3 text-center font-medium transition-all ${
                  currency === c
                    ? "border-amber-500 bg-amber-500/20 text-amber-300"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                {c === "VND" ? "\u20AB VND" : "$ USD"}
              </button>
            ))}
          </div>
        </div>

        {/* Language Toggle */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <GlobeIcon className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{t.settings.language}</h3>
              <p className="text-sm text-gray-500">
                {t.settings.languageDesc}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`flex-1 rounded-xl border py-3 text-center font-medium transition-all ${
                  locale === l
                    ? "border-amber-500 bg-amber-500/20 text-amber-300"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                {l === "vi" ? "\ud83c\uddfb\ud83c\uddf3" : "\ud83c\uddfa\ud83c\uddf8"} {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Achievements */}
        <div className="mt-4">
          <AchievementsSection />
        </div>

        {/* Export Data */}
        <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <DownloadIcon className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{t.exportData.title}</h3>
              <p className="text-sm text-gray-500">{t.exportData.csvDesc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
              const a = document.createElement("a");
              a.href = `${basePath}/api/entries/export`;
              a.download = "";
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
            className="mt-4 w-full rounded-xl border border-amber-500/20 py-3 text-center text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/10"
          >
            {t.exportData.csv}
          </button>
        </div>

        {/* Clear Data */}
        <div className="mt-4 rounded-2xl border border-red-500/10 bg-red-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Trash2Icon className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{t.settings.clearData}</h3>
              <p className="text-sm text-gray-500">
                {t.settings.clearDataDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setClearConfirm(true)}
            className="mt-4 w-full rounded-xl border border-red-500/20 py-3 text-center text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
          >
            {t.settings.clearDataButton}
          </button>
        </div>

        {/* Sign Out */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <LogOutIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{t.auth.logout}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-4 w-full rounded-xl border border-white/10 py-3 text-center text-sm font-medium text-gray-400 transition-all hover:bg-white/5 disabled:opacity-50"
          >
            {signingOut ? t.auth.loggingOut : t.auth.logout}
          </button>
        </div>

        {/* About */}
        <div className="mt-4 mb-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <InfoIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">{t.settings.about}</h3>
              <p className="text-sm text-gray-500">
                {t.settings.aboutDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clear confirmation */}
      {clearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-gray-900 p-6">
            <h3 className="text-lg font-bold text-white">{t.settings.clearConfirmTitle}</h3>
            <p className="mt-2 text-sm text-gray-400">
              {t.settings.clearConfirmDesc}
            </p>
            {clearError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {clearError}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setClearConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50"
              >
                {clearing ? t.settings.clearing : t.settings.clearConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
