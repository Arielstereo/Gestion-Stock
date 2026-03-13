"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, FileSpreadsheet, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStock, PRODUCT_KEYS, PRODUCT_LABELS } from "@/context/StockContext";
import { cn } from "@/lib/utils";
import EntryStats from "@/components/EntryStats";
import { AlertCircle } from "lucide-react";

// Subcampos que no se muestran en la tabla (solo en el Stats)
const SUB_KEYS = new Set([
  "tamboresPcbVigentes",
  "tamboresPcbDaniados",
  "tamboresPcbVencidos",
  "tamboresPesticidasVigentes",
  "tamboresPesticidasDaniados",
  "tamboresPesticidasVencidos",
  "sobreTamboresVigentes",
  "sobreTamboresDaniados",
  "sobreTamboresVencidos",
  "bolsonesPcbVigentes",
  "bolsonesPcbVencidos",
  "bolsonesPesticidasVigentes",
  "bolsonesPesticidasVencidos",
]);
const TABLE_KEYS = PRODUCT_KEYS.filter((k) => !SUB_KEYS.has(k));

const formatEntryDate = (entry, fmt = "MMMM yyyy") => {
  const year = Number(entry?.year);
  const month = Number(entry?.month);
  if (!year || !month || isNaN(year) || isNaN(month)) return "Sin fecha";
  return format(new Date(year, month - 1), fmt, { locale: es });
};

const DashboardPage = () => {
  const { getSortedEntries, isLoading } = useStock();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const entries = getSortedEntries();

  const exportEntry = (e, entry) => {
    e.stopPropagation(); // no abrir el stats al hacer click en exportar
    const periodoLabel = formatEntryDate(entry);
    const capitalizado =
      periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1);

    const rows = [["Periodo", capitalizado], [], ["Producto", "Stock actual"]];

    for (const key of TABLE_KEYS) {
      rows.push([
        PRODUCT_LABELS[key],
        entry.finalStock?.[key] ?? entry.operatorStock?.[key] ?? 0,
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 15 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    const blob = new Blob(
      [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/octet-stream" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_${entry.month.toString().padStart(2, "0")}_${entry.year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      const monthStr = entry.month?.toString().padStart(2, "0");
      const yearStr = entry.year?.toString();
      const monthName = formatEntryDate(entry, "MMMM").toLowerCase();
      return (
        `${monthStr}/${yearStr}`.includes(query) ||
        monthName.includes(query) ||
        yearStr?.includes(query)
      );
    });
  }, [entries, searchQuery]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Historial de Stock
              </CardTitle>
              <CardDescription className="mt-2">
                {entries.length} registro cargado
                {entries.length !== 1 ? "s" : ""} — hacé click en un mes para
                ver el detalle. Descarga el stock en Excel para compartirlo o
                archivarlo.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por mes, año..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="flex gap-2 justify-center items-center text-center py-12 text-blue-600 bg-blue-50 border border-blue-300 rounded-xl">
              <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
              {entries.length === 0
                ? "No hay registros de stock."
                : "No se encontraron resultados para tu búsqueda."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry, index) => {
                const hasAdminAdj = !!entry.adminSubmittedAt;
                return (
                  <div
                    key={entry._id}
                    onClick={() => setSelectedEntry(entry)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-colors hover:bg-muted/60 active:bg-muted",
                      index === 0 &&
                        "border-blue-200 bg-blue-50/50 hover:bg-blue-50",
                    )}
                  >
                    {/* Info principal */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold capitalize text-sm">
                          {formatEntryDate(entry)}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-green-100 border border-green-300 text-green-800 px-2 py-0.5 rounded-full animate-pulse">
                            Última carga
                          </span>
                        )}
                        {hasAdminAdj && (
                          <span className="text-xs bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-0.5 rounded-full">
                            Ajustado
                          </span>
                        )}
                      </div>

                      {/* Preview rápido de los totales principales */}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-2">
                        {TABLE_KEYS.slice(0, 4).map((key) => {
                          const val =
                            entry.finalStock?.[key] ??
                            entry.operatorStock?.[key] ??
                            0;

                          return (
                            <span key={key}>
                              {PRODUCT_LABELS[key]}:{" "}
                              <span className="font-semibold text-foreground">
                                {val}
                              </span>
                            </span>
                          );
                        })}
                        {TABLE_KEYS.length > 4 && (
                          <span className="text-muted-foreground">
                            +{TABLE_KEYS.length - 4} más...
                          </span>
                        )}

                        <span className="text-blue-600 font-medium">
                          Ver detalle{" "}
                          <ChevronRight className="h-3 w-3 inline text-blue-600 font-bold" />
                        </span>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        Cargado:{" "}
                        {entry.operatorSubmittedAt
                          ? format(
                              new Date(entry.operatorSubmittedAt),
                              "dd/MM/yyyy HH:mm",
                            )
                          : entry.createdAt
                            ? format(
                                new Date(entry.createdAt),
                                "dd/MM/yyyy HH:mm",
                              )
                            : "-"}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Button
                        size="lg"
                        variant="ghost"
                        onClick={(e) => exportEntry(e, entry)}
                        className="gap-1 text-white hover:text-white hover:bg-green-800 cursor-pointer bg-black border border-white mt-2"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">
                          Exportar Excel
                        </span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      {selectedEntry && (
        <EntryStats
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
