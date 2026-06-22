"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";

const slides = ["/slide1.png", "/slide2.png"];

export default function LandingClient() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing">
      {slides.map((src, i) => (
        <div
          key={src}
          className="landing-slide"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}
      <div className="landing-overlay" />
      <div className="landing-body">
        <div className="landing-content">
          <div className="landing-brand">
            <div className="landing-logo">ЖАК</div>
            <div>
              <h1 className="landing-title">СЭД ЖАК ЖАГУ</h1>
              <p className="landing-subtitle">Система электронного документооборота</p>
            </div>
          </div>
        </div>
        <button className="landing-go" onClick={() => router.push("/login")}>
          <span>GO</span>
          <IconArrowRight size={28} />
        </button>
      </div>
      <div className="landing-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`landing-dot ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
}
