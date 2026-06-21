"use client";

import { IconPrinter } from "@tabler/icons-react";

export default function PrintButton() {
  return (
    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
      <IconPrinter size={16} />Печать
    </button>
  );
}
