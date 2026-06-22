"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";
import { IconPhone, IconMail, IconMapPin, IconUser, IconSchool, IconBook, IconMicroscope } from "@tabler/icons-react";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="footer-brand">
            <div className="footer-logo">
              <span>ЖАК</span>
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
          <span className="footer-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IconMail size={14} /> {t("footer.contactEmail")}
          </span>
          <span className="footer-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IconPhone size={14} /> {t("footer.contactPhone")}
          </span>
          <span className="footer-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IconMapPin size={14} /> г. Жалал-Абад
          </span>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">{t("footer.legal")}</p>
          <span className="footer-link">{t("footer.privacy")}</span>
          <span className="footer-link">{t("footer.terms")}</span>
          <span className="footer-link">{t("footer.regulations")}</span>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <p className="footer-col-title" style={{ fontSize: 12, marginBottom: 8 }}>{t("footer.aboutAuthor")}</p>
            <span className="footer-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconUser size={14} /> {t("footer.authorName")}
            </span>
            <span className="footer-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconSchool size={14} /> {t("footer.authorGroup")}
            </span>
            <span className="footer-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconBook size={14} /> {t("footer.authorTheme")}
            </span>
            <span className="footer-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconMicroscope size={14} /> {t("footer.authorSupervisor")}
            </span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t("app.copyright").replace("{year}", String(year))}</p>
      </div>
    </footer>
  );
}
