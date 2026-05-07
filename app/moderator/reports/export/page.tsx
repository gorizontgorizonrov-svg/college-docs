import { getAllSpecialties } from "@/actions/moderator";
import ExportForm from "./ExportForm";

export const dynamic = 'force-dynamic';

export default async function ExportPage() {
  const specialties = await getAllSpecialties();
  return <ExportForm specialties={specialties} />;
}