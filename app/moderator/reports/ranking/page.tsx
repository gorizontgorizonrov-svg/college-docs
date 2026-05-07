import { getEnrollmentRanking } from "@/actions/reports";
import { getAllSpecialties } from "@/actions/moderator";
import RankingTable from "./RankingTable";

export const dynamic = 'force-dynamic';

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ specialty?: string }> }) {
  const params = await searchParams;
  const specialtyId = params?.specialty || undefined;

  const [ranking, specialties] = await Promise.all([
    getEnrollmentRanking(specialtyId),
    getAllSpecialties(),
  ]);

  return <RankingTable ranking={ranking as any} specialties={specialties as any} />;
}