import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/images/college-logo.svg" alt="ЖАК" />
            </div>
            <div>
              <p className="footer-brand-name">ЖАК ЖАГУ</p>
              <p className="footer-brand-sub">Жалал-Абадский колледж</p>
            </div>
          </div>
          <p className="footer-desc">
            Система электронного документооборота для автоматизации работы с документами
            Жалал-Абадского колледжа — СП ЖАГУ.
          </p>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Система</p>
          <Link href="/dashboard" className="footer-link">Главная</Link>
          <Link href="/documents" className="footer-link">Документы</Link>
          <Link href="/incoming" className="footer-link">Входящие</Link>
          <Link href="/archive" className="footer-link">Архив</Link>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Поддержка</p>
          <span className="footer-link">it@jak.kg</span>
          <span className="footer-link">+996 (XXX) XX-XX-XX</span>
          <span className="footer-link">г. Жалал-Абад</span>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Правовая информация</p>
          <span className="footer-link">Политика конфиденциальности</span>
          <span className="footer-link">Условия использования</span>
          <span className="footer-link">Регламент СЭД</span>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} ЖАК ЖАГУ. Все права защищены.</p>
      </div>
    </footer>
  );
}
