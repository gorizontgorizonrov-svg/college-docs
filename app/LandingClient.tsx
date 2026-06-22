"use client";

import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";

export default function LandingClient() {
  const router = useRouter();

  return (
    <div className="landing">
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
    </div>
  );
}
