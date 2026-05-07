import { getEnrolledStudents } from "@/actions/reports";
import { getAllSpecialties } from "@/actions/moderator";
import PrintOrdersForm from "./PrintOrdersForm";

export const dynamic = 'force-dynamic';

export default async function PrintOrdersPage() {
  const [enrolled, specialties] = await Promise.all([
    getEnrolledStudents(),
    getAllSpecialties(),
  ]);

  const enrolledData = enrolled.map((e: any) => ({
    ...e,
    applicant: {
      ...e.applicant,
      avgGrade: Number(e.applicant.avgGrade),
    },
  }));

  return <PrintOrdersForm specs={specialties} enrolled={enrolledData} />;
}