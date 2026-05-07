"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Phone, Calendar, Save } from "lucide-react";
import { createApplicantProfile, updateApplicantProfile } from "@/actions/auth";
import { useSession } from "next-auth/react";

const profileSchema = z.object({
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
  middleName: z.string().optional(),
  birthDate: z.string().min(1, "Выберите дату рождения"),
  schoolCertType: z.enum(["GRADE_9", "GRADE_11"]),
  avgGrade: z.number().min(1, "Введите средний балл").max(5, "Максимальный балл 5"),
  phoneNumber: z.string().min(1, "Введите номер телефона"),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ApplicantProfile {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string;
  schoolCertType?: "GRADE_9" | "GRADE_11";
  avgGrade?: number;
  phoneNumber?: string;
}

interface ProfileEditFormProps {
  profile?: ApplicantProfile;
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "+";
  if (digits.length <= 3) return "+" + digits;
  if (digits.length <= 6) return `+996${digits.slice(3)}`;
  if (digits.length <= 9) return `+996${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `+996${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`.trim();
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneDisplay, setPhoneDisplay] = useState(profile?.phoneNumber || "+996");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile ? {
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName,
      birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split("T")[0] : "",
      schoolCertType: profile.schoolCertType,
      avgGrade: profile.avgGrade,
      phoneNumber: profile.phoneNumber,
    } : undefined,
  });

  useEffect(() => {
    if (profile?.phoneNumber) {
      const formatted = formatPhoneNumber(profile.phoneNumber);
      setPhoneDisplay(formatted);
      setValue("phoneNumber", formatted);
    }
  }, [profile, setValue]);

  const onPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneDisplay(formatted);
    setValue("phoneNumber", formatted);
  }, [setValue]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!session?.user) {
        throw new Error("Необходимо войти в систему");
      }

      if (profile) {
        await updateApplicantProfile(session.user.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          birthDate: new Date(data.birthDate),
          schoolCertType: data.schoolCertType,
          avgGrade: data.avgGrade,
          phoneNumber: data.phoneNumber,
        });
      } else {
        await createApplicantProfile({
          userId: session.user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          birthDate: new Date(data.birthDate),
          schoolCertType: data.schoolCertType,
          avgGrade: data.avgGrade,
          phoneNumber: data.phoneNumber,
        });
      }

      router.push("/applicant/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении профиля");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Фамилия *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              {...register("lastName")}
              placeholder="Иванов"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            />
          </div>
          {errors.lastName && (
            <p className="text-red-500 text-sm">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Имя *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              {...register("firstName")}
              placeholder="Иван"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            />
          </div>
          {errors.firstName && (
            <p className="text-red-500 text-sm">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Отчество (необязательно)</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              {...register("middleName")}
              placeholder="Иванович"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Дата рождения *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              {...register("birthDate")}
              type="date"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            />
          </div>
          {errors.birthDate && (
            <p className="text-red-500 text-sm">{errors.birthDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Тип аттестата *</label>
          <select
            {...register("schoolCertType")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            <option value="">Выберите тип</option>
            <option value="GRADE_9">Аттестат 9 класса</option>
            <option value="GRADE_11">Аттестат 11 класса</option>
          </select>
          {errors.schoolCertType && (
            <p className="text-red-500 text-sm">{errors.schoolCertType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Средний балл *</label>
          <input
            {...register("avgGrade", { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="1"
            max="5"
            placeholder="4.50"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          />
          {errors.avgGrade && (
            <p className="text-red-500 text-sm">{errors.avgGrade.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Телефон *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phoneDisplay}
              onChange={onPhoneChange}
              placeholder="+996 500 000 000"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span>Сохранение...</span>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Сохранить
          </>
        )}
      </button>
    </form>
  );
}