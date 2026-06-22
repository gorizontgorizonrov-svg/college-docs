import { auth } from "@/auth";
import Link from "next/link";
import { IconArrowLeft, IconSchool, IconBook, IconMicroscope, IconMail, IconPhone, IconCalendar } from "@tabler/icons-react";

export default async function AboutAuthorPage() {
  const session = await auth();

  return (
    <div className="anim-fade-in" style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
      <Link href={session?.user ? "/dashboard" : "/"} className="btn btn-ghost" style={{ marginBottom: 24 }}>
        <IconArrowLeft size={16} />
        Назад
      </Link>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--accent)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700,
          }}>
            ОХ
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Хуртажиев Ойбек
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
              Разработчик системы электронного документооборота
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="mf">
            <label><IconSchool size={14} /> Группа</label>
            <span style={{ fontWeight: 500 }}>ПОВТАСк-3-23</span>
          </div>
          <div className="mf">
            <label><IconBook size={14} /> Тема дипломной работы</label>
            <span>Автоматизация документооборота в Жалал-Абадском колледже</span>
          </div>
          <div className="mf">
            <label><IconMicroscope size={14} /> Научный руководитель</label>
            <span>Ст. преп. кафедры ПОВТАС</span>
          </div>
          <div className="mf">
            <label><IconMail size={14} /> Email</label>
            <span>gorizontgorizonrov@gmail.com</span>
          </div>
          <div className="mf">
            <label><IconPhone size={14} /> Телефон</label>
            <span>0707 971 260</span>
          </div>
          <div className="mf">
            <label><IconCalendar size={14} /> Дата защиты</label>
            <span>22.06.2026</span>
          </div>
        </div>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>О системе</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            СЭД ЖАК ЖАГУ — система электронного документооборота Жалал-Абадского колледжа ЖАГУ.
            Разработана в рамках квалификационной работы по специальности &laquo;Программное обеспечение
            вычислительной техники и автоматизированных систем&raquo;.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 8 }}>
            Система обеспечивает полный цикл управления документами: создание, согласование,
            подписание электронной подписью, регистрацию, контроль исполнения и архивное хранение.
          </p>
        </div>
      </div>
    </div>
  );
}
