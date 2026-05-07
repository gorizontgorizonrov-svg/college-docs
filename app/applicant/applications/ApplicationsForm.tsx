"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, GraduationCap, AlertCircle } from "lucide-react";
import { getSpecialties, submitApplication } from "@/actions/applicant";
import { getApplicantProfile } from "@/actions/auth";
import { useSession } from "next-auth/react";

export function ApplicationsForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSpecialties().then((data) => {
      setSpecialties(data);
      setLoading(false);
    });
  }, []);

  const toggleSpecialty = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError("Выберите хотя бы одну специальность");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (!session?.user?.id) {
        throw new Error("Не авторизован");
      }

      const applicant = await getApplicantProfile(session.user.id);

      if (!applicant) {
        throw new Error("Профиль не найден");
      }

      await submitApplication({
        applicantId: applicant.id,
        specialtyIds: selected,
      });

      router.push("/applicant/status");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при подаче заявления");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <p className="text-sm text-gray-600">
        Выберите до 3 специальностей в порядке приоритета (1 — наиболее предпочтительная)
      </p>

      {specialties.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            Специальности пока не добавлены. Обратитесь к администратору.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {specialties.map((spec) => {
            const isSelected = selected.includes(spec.id);
            const priority = selected.indexOf(spec.id) + 1;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => toggleSpecialty(spec.id)}
                disabled={submitting}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${submitting ? "opacity-50" : ""}`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  {isSelected ? (
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {priority}
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{spec.name}</p>
                  <p className="text-sm text-gray-500">Код: {spec.code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">
                    Бюджет: {spec.budgetPlaces}
                  </p>
                  <p className="text-sm text-gray-500">
                    Договор: {spec.contractPlaces}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || selected.length === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span>Отправка...</span>
        ) : (
          <>
            <Check className="w-5 h-5" />
            Подать заявление
          </>
        )}
      </button>
    </div>
  );
}