"use client";

import { useTranslation } from "@/lib/i18n/client";
import { locales, localeNames, localeFlags, localeLabels } from "@/lib/i18n/config";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="language-switcher">
      <div className="language-switcher-header">
        {!compact && <Globe size={18} />}
        <span className="language-switcher-label">
          {compact ? localeFlags[locale] : t("settings.language")}
        </span>
      </div>
      <div className="language-switcher-options">
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`language-option ${l === locale ? "active" : ""}`}
            title={localeLabels[l]}
          >
            <span className="language-flag">{localeFlags[l]}</span>
            <span className="language-name">{localeNames[l]}</span>
          </button>
        ))}
      </div>
      <style jsx>{`
        .language-switcher {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .language-switcher-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .language-switcher-options {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .language-option {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .language-option:hover {
          border-color: var(--accent);
          color: var(--text-primary);
        }
        .language-option.active {
          border-color: var(--accent);
          background: var(--accent);
          color: white;
        }
        .language-flag {
          font-size: 16px;
          line-height: 1;
        }
        .language-name {
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
