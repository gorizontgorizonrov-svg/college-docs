import { getAuditLogs } from "@/actions/audit";
import AuditLogTable from "./AuditLogTable";

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const logs = await getAuditLogs();
  
  return <AuditLogTable logs={logs as any} />;
}