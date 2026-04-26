import React, { useState } from "react";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText, Settings2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

// ───────── Types ─────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
}

export interface OutpostInfo {
  name: string;
  city: string;
  leader: string;
  totalDestacamentos?: number;
}

export interface ExportManagerProps<T extends Record<string, unknown>> {
  data: T[];
  availableColumns: ColumnDef<T>[];
  filename: string;
  reportTitle: string;
  outpostInfo: OutpostInfo;
}

// ───────── Helpers ────────────────────────────────────────────────────────────

function getCellValue<T>(row: T, key: keyof T): string | number {
  const val = row[key];
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toLocaleDateString("es-ES");
  if (typeof val === "boolean") return val ? "Sí" : "No";
  return String(val);
}

// ───────── Checkbox visual (NOT a button, just a styled div) ─────────────────

function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        flexShrink: 0,
        borderRadius: 4,
        border: checked ? "2px solid #0d9488" : "2px solid #cbd5e1",
        background: checked ? "#0d9488" : "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
      }}
    >
      {checked && (
        <Check size={10} color="#fff" strokeWidth={3} />
      )}
    </div>
  );
}

// ───────── Component ──────────────────────────────────────────────────────────

export function ExportManager<T extends Record<string, unknown>>({
  data,
  availableColumns,
  filename,
  reportTitle,
  outpostInfo,
}: ExportManagerProps<T>) {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<keyof T>>(
    () => new Set(availableColumns.map((c) => c.key))
  );

  const handleOpenChange = (value: boolean) => {
    if (value) setSelectedKeys(new Set(availableColumns.map((c) => c.key)));
    setOpen(value);
  };

  const toggleKey = (key: keyof T) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const allChecked = selectedKeys.size === availableColumns.length;

  const toggleAll = () => {
    if (allChecked) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(availableColumns.map((c) => c.key)));
    }
  };

  const activeCols = availableColumns.filter((c) => selectedKeys.has(c.key));
  const formattedName = outpostInfo.name === "Destacamento" || outpostInfo.name?.startsWith("Territorio") ? outpostInfo.name : `Destacamento: ${outpostInfo.name}`;
  const outpostLine = [formattedName, outpostInfo.city].filter(Boolean).join("  ·  ");

  // ── Excel ────────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const wb = xlsx.utils.book_new();
    const dateStr = new Date().toLocaleDateString("es-ES");
    const headerRows: (string | number)[][] = [
      [reportTitle],
      [formattedName, "", outpostInfo.city],
      [`Generado: ${dateStr}`]
    ];
    if (outpostInfo.totalDestacamentos !== undefined) {
      headerRows.push([`Total Destacamentos Evaluados: ${outpostInfo.totalDestacamentos}`]);
    }
    headerRows.push([]);

    const rows: (string | number)[][] = [
      ...headerRows,
      activeCols.map((c) => c.label),
      ...data.map((row) => activeCols.map((c) => getCellValue(row, c.key))),
    ];
    const ws = xlsx.utils.aoa_to_sheet(rows);
    if (activeCols.length > 0) {
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: activeCols.length - 1 } }];
    }
    ws["!cols"] = activeCols.map(() => ({ wch: 22 }));
    xlsx.utils.book_append_sheet(wb, ws, "Reporte");
    xlsx.writeFile(wb, `${filename}.xlsx`);
    setOpen(false);
  };

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    const doc = new jsPDF(activeCols.length > 5 ? "landscape" : "portrait");
    const W = doc.internal.pageSize.getWidth();
    const M = 14;

    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, W, 38, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(reportTitle, M, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(204, 251, 241);
    if (outpostLine) doc.text(outpostLine, M, 23);
    if (outpostInfo.totalDestacamentos !== undefined) {
      doc.text(`Destacamentos: ${outpostInfo.totalDestacamentos}`, W / 2, 31, { align: "center" });
    }
    const dateStr = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
    doc.text(dateStr, W - M, 31, { align: "right" });

    autoTable(doc, {
      head: [activeCols.map((c) => c.label)],
      body: data.map((row) => activeCols.map((c) => getCellValue(row, c.key))),
      startY: 44,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      margin: { left: M, right: M },
    });

    doc.save(`${filename}.pdf`);
    setOpen(false);
  };

  // ───────── JSX ───────────────────────────────────────────────────────────────
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOpenChange(true)}
        className="gap-2 h-9 text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
      >
        <Download className="w-4 h-4 text-slate-500" />
        <span className="hidden sm:inline">Exportar</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-md w-full"
          style={{ display: "flex", flexDirection: "column", maxHeight: "90vh", padding: 0, gap: 0, overflow: "hidden" }}
        >
          {/* ── Header ─────────────────────────────────── */}
          <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
            <DialogHeader>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Settings2 size={16} color="#0d9488" />
                </div>
                <div>
                  <DialogTitle style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Exportar Reporte</DialogTitle>
                  <DialogDescription style={{ fontSize: 12, marginTop: 2, color: "#64748b" }}>
                    Elige las columnas a incluir
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Outpost info */}
            <div style={{ marginTop: 12, borderRadius: 10, border: "1px solid #99f6e4", background: "linear-gradient(135deg, #f0fdfa, #ecfdf5)", padding: "10px 14px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#134e4a", marginBottom: 2 }}>{reportTitle}</p>
              {outpostLine && <p style={{ fontSize: 12, color: "#0f766e" }}>{outpostLine}</p>}
              {outpostInfo.totalDestacamentos !== undefined && <p style={{ fontSize: 11, color: "#14b8a6" }}>Destacamentos: {outpostInfo.totalDestacamentos}</p>}
            </div>
          </div>

          {/* ── Column selector (scrollable) ─────────── */}
          <div style={{ flex: 1, overflow: "auto", padding: "0.75rem 1.25rem" }}>
            {/* Select all row */}
            <div
              onClick={toggleAll}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", marginBottom: 8 }}
            >
              <CheckIcon checked={allChecked} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", userSelect: "none" }}>
                {allChecked ? "Deseleccionar todo" : "Seleccionar todo"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                {selectedKeys.size}/{availableColumns.length}
              </span>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 10 }} />

            {/* Column tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {availableColumns.map((col) => {
                const isChecked = selectedKeys.has(col.key);
                return (
                  <div
                    key={String(col.key)}
                    onClick={() => toggleKey(col.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: isChecked ? "1.5px solid #5eead4" : "1.5px solid #e2e8f0",
                      background: isChecked ? "#f0fdfa" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                  >
                    <CheckIcon checked={isChecked} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: isChecked ? "#115e59" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {col.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Action buttons (always visible at bottom) ── */}
          <div style={{ padding: "0.75rem 1.25rem 1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={selectedKeys.size === 0}
              onClick={handleExportExcel}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "0.6rem 1rem",
                borderRadius: 8,
                border: "2px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#15803d",
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedKeys.size === 0 ? "not-allowed" : "pointer",
                opacity: selectedKeys.size === 0 ? 0.4 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <FileSpreadsheet size={16} />
              Excel
            </button>
            <button
              type="button"
              disabled={selectedKeys.size === 0}
              onClick={handleExportPDF}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "0.6rem 1rem",
                borderRadius: 8,
                border: "none",
                background: "#0d9488",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedKeys.size === 0 ? "not-allowed" : "pointer",
                opacity: selectedKeys.size === 0 ? 0.4 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
