"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconMail, IconLock, IconLogin, IconShield, IconFileText, IconSchool } from "@tabler/icons-react";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
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
      router.push("/dashboard");
    }
  }, [session, router]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Неверный email или пароль");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo">
          <span>ЖАК</span>
        </div>
        <h1>СЭД ЖАК ЖАГУ</h1>
        <p>Система электронного документооборота Жалал-Абадского колледжа</p>
      </div>

      <div className="login-body" style={{ animation: "fadeUp 0.6s ease forwards" }}>
        <div className="login-card anim-fade-up">
          <div className="login-card-header">
            <h2>Вход в систему</h2>
            <p>Войдите с помощью учётной записи сотрудника</p>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="login-field anim-stagger">
              <label>Email</label>
              <div className="login-input-wrap">
                <IconMail size={18} className="login-input-icon" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="admin@jak.kg"
                  className="login-input"
                />
              </div>
              {errors.email && <p className="login-field-error">{errors.email.message}</p>}
            </div>

            <div className="login-field">
              <label>Пароль</label>
              <div className="login-input-wrap">
                <IconLock size={18} className="login-input-icon" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Введите пароль"
                  className="login-input"
                />
              </div>
              {errors.password && <p className="login-field-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="login-btn">
              {isLoading ? (
                "Вход..."
              ) : (
                <>
                  <IconLogin size={18} />
                  Войти
                </>
              )}
            </button>
          </form>

          <div className="login-features">
            <div className="login-feature">
              <IconFileText size={16} />
              <span>Электронные документы</span>
            </div>
            <div className="login-feature">
              <IconShield size={16} />
              <span>ЭЦП подпись</span>
            </div>
            <div className="login-feature">
              <IconSchool size={16} />
              <span>СЭД колледжа</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-footer">
        <div className="login-footer-content">
          <div className="login-footer-left">
            <div className="login-footer-logo">ЖАК</div>
            <div>
              <p className="login-footer-name">ЖАК ЖАГУ</p>
              <p className="login-footer-sub">Жалал-Абадский колледж</p>
            </div>
          </div>
          <p className="login-footer-copy">© {new Date().getFullYear()} ЖАК ЖАГУ. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
