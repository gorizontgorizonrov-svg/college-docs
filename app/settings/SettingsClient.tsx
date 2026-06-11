"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Globe,
  Sun,
  Moon,
  Compass,
  HelpCircle,
  Keyboard,
  BookOpen,
} from "lucide-react";

export function SettingsClient() {
  const { locale, t } = useTranslation();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as "light" | "dark" | null;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const helpItems = [
    {
      icon: <Keyboard size={20} />,
      title: "Клавиатурные сокращения",
      titleKy: "Клавиатуралык кыскартуулар",
      titleEn: "Keyboard shortcuts",
      titleZh: "键盘快捷键",
      desc: "Используйте Ctrl+N для создания документа, Ctrl+F для поиска",
      descKy: "Ctrl+N — документ түзүү, Ctrl+F — издөө",
      descEn: "Use Ctrl+N to create, Ctrl+F to search",
      descZh: "使用 Ctrl+N 创建文件，Ctrl+F 搜索",
    },
    {
      icon: <BookOpen size={20} />,
      title: "Руководство пользователя",
      titleKy: "Колдонуучу нускамасы",
      titleEn: "User guide",
      titleZh: "用户指南",
      desc: "Ознакомьтесь с документацией системы",
      descKy: "Системанын документациясы менен таанышыңыз",
      descEn: "Read the system documentation",
      descZh: "阅读系统文档",
    },
    {
      icon: <HelpCircle size={20} />,
      title: "Часто задаваемые вопросы",
      titleKy: "Көп берилүүчү суроолор",
      titleEn: "FAQ",
      titleZh: "常见问题",
      desc: "Ответы на популярные вопросы по работе с системой",
      descKy: "Система менен иштөө боюнча көп берилүүчү суроолорго жооптор",
      descEn: "Answers to frequently asked questions",
      descZh: "关于系统使用的常见问题解答",
    },
  ];

  const getHelpTitle = (item: typeof helpItems[0]) => {
    if (locale === "ky") return item.titleKy;
    if (locale === "en") return item.titleEn;
    if (locale === "zh") return item.titleZh;
    return item.title;
  };

  const getHelpDesc = (item: typeof helpItems[0]) => {
    if (locale === "ky") return item.descKy;
    if (locale === "en") return item.descEn;
    if (locale === "zh") return item.descZh;
    return item.desc;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Language Settings */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("settings.language")}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">{t("settings.languageDesc")}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            {theme === "light" ? (
              <Sun className="w-5 h-5 text-[var(--accent)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--accent)]" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("settings.appearance")}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">{t("settings.appearanceDesc")}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={`theme-option ${theme === "light" ? "active" : ""}`}
              >
                <Sun size={16} />
                <span>{t("settings.themeLight")}</span>
              </button>
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={`theme-option ${theme === "dark" ? "active" : ""}`}
              >
                <Moon size={16} />
                <span>{t("settings.themeDark")}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="checkbox" />
                {t("settings.showQuickActions")}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="checkbox" />
                {t("settings.showDescriptions")}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Help */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("settings.navigation")}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">{t("settings.navigationDesc")}</p>
            </div>
            <div className="space-y-3">
              {helpItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {getHelpTitle(item)}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {getHelpDesc(item)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .theme-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .theme-option:hover {
          border-color: var(--accent);
        }
        .theme-option.active {
          border-color: var(--accent);
          background: var(--accent);
          color: white;
        }
        .checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
