"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/images/college-logo.svg" alt={t("app.shortName")} />
            </div>
            <div>
              <p className="footer-brand-name">{t("app.shortName")} {t("app.college").split(" ").pop()}</p>
              <p className="footer-brand-sub">{t("app.college")}</p>
            </div>
          </div>
          <p className="footer-desc">
            {t("app.description")}
          </p>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">{t("footer.system")}</p>
          <Link href="/dashboard" className="footer-link">{t("footer.home")}</Link>
          <Link href="/documents" className="footer-link">{t("nav.documents")}</Link>
          <Link href="/incoming" className="footer-link">{t("nav.incoming")}</Link>
          <Link href="/archive" className="footer-link">{t("nav.archive")}</Link>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">{t("footer.support")}</p>
          <span className="footer-link">it@jak.kg</span>
          <span className="footer-link">+996 (XXX) XX-XX-XX</span>
          <span className="footer-link">г. Жалал-Абад</span>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">{t("footer.legal")}</p>
          <span className="footer-link">{t("footer.privacy")}</span>
          <span className="footer-link">{t("footer.terms")}</span>
          <span className="footer-link">{t("footer.regulations")}</span>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t("app.copyright").replace("{year}", String(year))}</p>
      </div>
    </footer>
  );
}
