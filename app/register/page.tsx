"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, Lock, User, Phone, UserPlus } from "lucide-react";
import Link from "next/link";
import { registerUser } from "@/actions/auth";

const registerSchema = z.object({
  phone: z.string().min(1, "Введите номер телефона").regex(/^\+996\d{9}$/, "Формат: +996XXXYYYYYY"),
  email: z.string().email("Введите корректный email").optional().or(z.literal("")),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  confirmPassword: z.string().min(1, "Подтвердите пароль"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser({
        phone: data.phone,
        email: data.email || undefined,
        password: data.password,
      });

      const result = await signIn("credentials", {
        login: data.phone,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ошибка при входе после регистрации");
      } else {
        router.push("/applicant");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return "+";
    if (digits.length <= 12) return `+${digits.slice(0, 3)}${digits.length > 3 ? digits.slice(3) : ""}`;
    return "+996" + digits.slice(3, 12);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
          Регистрация
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Телефон *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register("phone")}
                type="tel"
                placeholder="+996500000000"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email (необязательно)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register("email")}
                type="email"
                placeholder="example@mail.ru"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Пароль *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register("password")}
                type="password"
                placeholder="Придумайте пароль"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Подтверждение пароля *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="Повторите пароль"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Регистрация...</span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Зарегистрироваться
              </>
            )}
          </button>
        </form>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <p className="text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}