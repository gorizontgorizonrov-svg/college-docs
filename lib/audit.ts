import { headers } from "next/headers";

export async function getAuditMeta() {
  const headersList = await headers();
  return {
    ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown",
    userAgent: headersList.get("user-agent") || undefined,
  };
}
