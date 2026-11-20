"use client";

import { Button } from "@ui-sdk/react/button";
import { Download, FileText } from "lucide-react";
import type { AuditReport } from "@/lib/schemas";
import { downloadDocx, downloadMarkdown } from "@/lib/exportUtils";

const buttonClass =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800";

export default function ExportButtons({ report }: { report: AuditReport }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button className={buttonClass} onClick={() => downloadMarkdown(report)}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Download .MD
      </Button>
      <Button className={buttonClass} onClick={() => downloadDocx(report)}>
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        Download .DOCX
      </Button>
    </div>
  );
}
