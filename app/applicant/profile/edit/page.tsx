import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApplicantProfile } from "@/actions/auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProfileEditForm } from "./ProfileEditForm";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getApplicantProfile(session.user.id);

  const profileData = profile ? {
    firstName: profile.firstName,
    lastName: profile.lastName,
    middleName: profile.middleName || undefined,
    birthDate: profile.birthDate.toISOString(),
    schoolCertType: profile.schoolCertType,
    avgGrade: Number(profile.avgGrade),
    phoneNumber: profile.phoneNumber,
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/applicant/profile"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {profile ? "Редактирование профиля" : "Заполнение профиля"}
          </h1>
        </div>

        <ProfileEditForm profile={profileData} />
      </div>
    </div>
  );
}