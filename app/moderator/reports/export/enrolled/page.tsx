import { getAllSpecialties } from "@/actions/moderator";
import EnrolledExportForm from "./ExportForm";

export const dynamic = 'force-dynamic';

export default async function EnrolledExportPage() {
  const specialties = await getAllSpecialties();
  return <EnrolledExportForm specialties={specialties} />;
}