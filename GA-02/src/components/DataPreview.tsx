import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataPreviewProps {
  data: Record<string, any>[];
  headers: string[];
  maxRows?: number;
  title?: string;
}

export default function DataPreview({ data, headers, maxRows = 100, title = "Data Preview" }: DataPreviewProps) {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const totalPages = Math.ceil(Math.min(data.length, maxRows) / pageSize);
  const displayData = useMemo(
    () => data.slice(page * pageSize, Math.min((page + 1) * pageSize, maxRows)),
    [data, page, maxRows]
  );

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">
          Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length.toLocaleString()} rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full data-grid">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground w-12">#</th>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                <td className="px-3 py-1.5 text-muted-foreground text-xs">{page * pageSize + i + 1}</td>
                {headers.map((h) => {
                  const val = row[h];
                  const isEmpty = val === null || val === undefined || val === "";
                  return (
                    <td
                      key={h}
                      className={`px-3 py-1.5 text-xs whitespace-nowrap max-w-[200px] truncate ${
                        isEmpty ? "text-muted-foreground/40 italic" : "text-foreground/80"
                      }`}
                    >
                      {isEmpty ? "null" : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
