import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          {t("settings.title")}
        </h1>
        <SettingsClient />
      </div>
    </div>
  );
}
