"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { checkRateLimit, resetRateLimit } from "@/actions/rate-limit";

const loginSchema = z.object({
  login: z.string().min(1, "Введите email или телефон"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (session?.user) {
      const role = session.user.role;
      if (role === "APPLICANT") {
        router.push("/applicant");
      } else if (role === "MODERATOR" || role === "ADMIN") {
        router.push("/moderator");
      }
    }
  }, [session, router]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    const rateCheck = await checkRateLimit(`login:${data.login}`);
    
    if (!rateCheck.allowed) {
      setError("Слишком много попыток. Попробуйте позже.");
      setIsLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      login: data.login,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Неверный логин или пароль");
      setIsLoading(false);
      return;
    }

    await resetRateLimit(`login:${data.login}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
          Вход в систему
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email или телефон</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register("login")}
                type="text"
                placeholder="example@mail.ru или +996500000000"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            {errors.login && (
              <p className="text-red-500 text-sm">{errors.login.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register("password")}
                type="password"
                placeholder="Введите пароль"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Вход...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Войти
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
      </div>
    </div>
  );
}