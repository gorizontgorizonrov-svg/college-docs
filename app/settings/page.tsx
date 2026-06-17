import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations();

  return (
    <div className="anim-fade-in space-y-4">
      <h1 className="doc-h1">{t("settings.title")}</h1>
      <SettingsClient />
    </div>
  );
}
