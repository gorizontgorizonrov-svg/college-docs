"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getProfile, updateProfile, uploadAvatar, changePassword } from "@/actions/profile";
import {
  IconUser,
  IconMail,
  IconBriefcase,
  IconBuilding,
  IconCamera,
  IconDeviceFloppy,
  IconLock,
  IconCheck,
  IconLoader2,
  IconShield,
} from "@tabler/icons-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "Минимум 2 символа"),
  lastName: z.string().min(2, "Минимум 2 символа"),
  middleName: z.string().optional(),
  email: z.string().email("Введите корректный email"),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z.string().min(6, "Минимум 6 символов"),
  confirmPassword: z.string().min(1, "Подтвердите пароль"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const roleLabels: Record<string, string> = {
  INITIATOR: "Инициатор", VALIDATOR: "Согласующий",
  SIGNER: "Подписант", REGISTRAR: "Регистратор", ADMIN: "Администратор",
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const initRef = useRef(false);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    getProfile(session.user.id).then((data) => {
      setProfile(data);
      if (data?.employee) {
        reset({
          firstName: data.employee.firstName || "",
          lastName: data.employee.lastName || "",
          middleName: data.employee.middleName || "",
          email: data.email || "",
        });
      } else {
        reset({ firstName: "", lastName: "", middleName: "", email: data?.email || "" });
      }
    }).catch(() => {
      setError("Ошибка загрузки профиля");
    }).finally(() => {
      setLoading(false);
    });
  }, [session, router, reset]);

  const refreshProfile = useCallback(async () => {
    const data = await getProfile(session!.user.id);
    setProfile(data);
    if (data?.employee) {
      reset({
        firstName: data.employee.firstName || "",
        lastName: data.employee.lastName || "",
        middleName: data.employee.middleName || "",
        email: data.email || "",
      });
    }
  }, [session, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(session!.user.id, data);
      setSuccess("Изменения сохранены");
      await refreshProfile();
      await update();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await uploadAvatar(fd);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки аватара");
    } finally {
      setAvatarUploading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await changePassword(session!.user.id, data.oldPassword, data.newPassword);
      setPasswordSuccess("Пароль изменён");
      resetPassword();
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Ошибка смены пароля");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!profile) {
    return <div className="empty-state"><p>Профиль не найден</p></div>;
  }

  const initials = profile.employee
    ? ((profile.employee.firstName?.[0] || "") + (profile.employee.lastName?.[0] || "")).toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() || "?";

  const fullName = profile.employee
    ? `${profile.employee.lastName || ""} ${profile.employee.firstName || ""} ${profile.employee.middleName || ""}`.trim()
    : "Пользователь";

  return (
    <div className="anim-fade-in" style={{ maxWidth: 960, margin: "0 auto" }}>
      {success && (
        <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <IconCheck size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 12, alignItems: "start" }}>
        {/* Left column — Avatar card */}
        <div className="glass-card" style={{ textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
            {profile.employee?.avatarUrl ? (
              <img src={profile.employee.avatarUrl} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--accent)" }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 auto" }}>
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--bg-page)", background: "var(--accent-gradient)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Изменить фото"
            >
              {avatarUploading ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <IconCamera size={14} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
          </div>

          <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 4 }}>{fullName}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
            {profile.employee?.position?.name || "—"}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, background: "var(--bg-selected)", color: "var(--accent-hover)", fontSize: 10.5, fontWeight: 600 }}>
            <IconShield size={12} />
            {roleLabels[profile.role] || profile.role}
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--glass-border)", fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <IconBuilding size={13} style={{ flexShrink: 0 }} />
              {profile.employee?.department?.name || "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 4 }}>
              <IconBriefcase size={13} style={{ flexShrink: 0 }} />
              {profile.employee?.position?.name || "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 4 }}>
              <IconMail size={13} style={{ flexShrink: 0 }} />
              {profile.email}
            </div>
          </div>
        </div>

        {/* Right column — Form */}
        <div className="glass-card">
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <IconUser size={16} /> Личные данные
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mg" style={{ marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>Фамилия *</label>
                <input {...register("lastName")} className="input" placeholder="Фамилия" />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>Имя *</label>
                <input {...register("firstName")} className="input" placeholder="Имя" />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>Отчество</label>
                <input {...register("middleName")} className="input" placeholder="Отчество" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>Должность</label>
                <input className="input" value={profile.employee?.position?.name || "—"} disabled style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>Отдел</label>
                <input className="input" value={profile.employee?.department?.name || "—"} disabled style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>Email *</label>
                <input {...register("email")} className="input" placeholder="Email" />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => refreshProfile()} className="btn">Отмена</button>
              <button type="submit" disabled={saving} className="btn btn-navy">
                {saving ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <IconDeviceFloppy size={14} />}
                Сохранить изменения
              </button>
            </div>
          </form>

          {/* Password change */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--glass-border)" }}>
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="btn"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <IconLock size={14} />
              {showPasswordForm ? "Отменить смену пароля" : "Сменить пароль"}
            </button>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} style={{ marginTop: 12 }}>
                {passwordSuccess && (
                  <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success)", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <IconCheck size={14} /> {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: 12 }}>
                    {passwordError}
                  </div>
                )}
                <div className="mg" style={{ marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>Текущий пароль</label>
                    <input {...registerPassword("oldPassword")} type="password" className="input" placeholder="••••••" />
                    {passwordErrors.oldPassword && <p className="form-error">{passwordErrors.oldPassword.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>Новый пароль</label>
                    <input {...registerPassword("newPassword")} type="password" className="input" placeholder="••••••" />
                    {passwordErrors.newPassword && <p className="form-error">{passwordErrors.newPassword.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>Подтверждение</label>
                    <input {...registerPassword("confirmPassword")} type="password" className="input" placeholder="••••••" />
                    {passwordErrors.confirmPassword && <p className="form-error">{passwordErrors.confirmPassword.message}</p>}
                  </div>
                </div>
                <button type="submit" disabled={passwordSaving} className="btn btn-navy" style={{ width: "100%" }}>
                  {passwordSaving ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <IconLock size={14} />}
                  Сменить пароль
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
