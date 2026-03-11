"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStock, PRODUCT_KEYS, PRODUCT_LABELS } from "@/context/StockContext";
import { cn } from "@/lib/utils";

// Detalle de subcategorías para mostrar en tabla y Excel
const TAMBORES_DETAIL = {
  tamboresPcb: [
    { key: "tamboresPcbVigentes", label: "Vigentes" },
    { key: "tamboresPcbDaniados", label: "Dañados" },
    { key: "tamboresPcbVencidos", label: "Vencidos" },
  ],
  tamboresPesticida: [
    { key: "tamboresPesticidaVigentes", label: "Vigentes" },
    { key: "tamboresPesticidaDaniados", label: "Dañados" },
    { key: "tamboresPesticidaVencidos", label: "Vencidos" },
  ],
};

const formatEntryDate = (entry, fmt = "MMMM yyyy") => {
  const year = Number(entry?.year);
  const month = Number(entry?.month);
  if (!year || !month || isNaN(year) || isNaN(month)) return "Sin fecha";
  return format(new Date(year, month - 1), fmt, { locale: es });
};

// function DiffBadge({ value }) {
//   if (!value || value === 0)
//     return <span className="text-muted-foreground text-xs">-</span>;
//   const positive = value > 0;
//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-0.5 text-xs font-semibold",
//         positive ? "text-green-600" : "text-red-600",
//       )}
//     >
//       {positive ? (
//         <TrendingUp className="h-3 w-3" />
//       ) : (
//         <TrendingDown className="h-3 w-3" />
//       )}
//       {positive ? "+" : ""}
//       {value}
//     </span>
//   );
// }

const DashboardPage = () => {
  const { getSortedEntries, isLoading } = useStock();
  const [searchQuery, setSearchQuery] = useState("");
  const entries = getSortedEntries();

  const exportEntry = (entry) => {
    const periodoLabel = formatEntryDate(entry);
    const capitalizado =
      periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1);

    const rows = [
      ["Periodo", capitalizado],
      [],
      ["Producto", "Conteo", "Compra/Consumo", "Stock Final"],
    ];

    for (const key of PRODUCT_KEYS) {
      const opVal = entry.operatorStock?.[key] ?? 0;
      const adjVal = entry.adminAdjustment?.[key] ?? 0;
      const finalVal = entry.finalStock?.[key];

      rows.push([PRODUCT_LABELS[key], opVal, adjVal, finalVal]);

      // Si tiene subcategorías, agregar filas indentadas debajo
      const subs = TAMBORES_DETAIL[key];
      if (subs) {
        for (const sub of subs) {
          const subOp = entry.operatorStock?.[sub.key] ?? 0;
          // const subAdj = entry.adminAdjustment?.[sub.key] ?? " ";
          // const subFinal = entry.finalStock?.[sub.key] ?? subOp;
          rows.push([`   * ${sub.label}`, subOp]);
        }
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 15 }, { wch: 14 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
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
              <CardDescription>
                {entries.length} registro{entries.length !== 1 ? "s" : ""}{" "}
                encontrado{entries.length !== 1 ? "s" : ""}
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
            <div className="text-center py-12 text-muted-foreground">
              {entries.length === 0
                ? "No hay registros de stock. Comenzá cargando el stock del mes actual."
                : "No se encontraron resultados para tu búsqueda."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">Periodo</TableHead>
                    <TableHead className="w-36">Cargado</TableHead>
                    {PRODUCT_KEYS.map((key) => (
                      <TableHead key={key} className="text-right min-w-22">
                        {PRODUCT_LABELS[key]}
                      </TableHead>
                    ))}
                    <TableHead className="w-24 text-center">Exportar</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredEntries.map((entry, index) => {
                    const hasAdminAdj = !!entry.adminSubmittedAt;

                    return (
                      <TableRow
                        key={entry._id}
                        className={index === 0 ? "bg-primary/5" : ""}
                      >
                        {/* Periodo */}
                        <TableCell className="font-medium capitalize">
                          <div className="flex flex-col gap-1">
                            <span>{formatEntryDate(entry)}</span>
                            {index === 0 && (
                              <span className="text-xs bg-green-100 border border-green-800 text-primary px-2 py-0.5 rounded-full w-fit animate-pulse">
                                Ultima carga
                              </span>
                            )}
                            {hasAdminAdj && (
                              <span className="text-xs bg-yellow-100 border border-yellow-400 text-yellow-800 px-2 py-0.5 rounded-full w-fit">
                                Ajustado
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Fecha de carga */}
                        <TableCell className="text-sm text-muted-foreground">
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
                        </TableCell>

                        {/* Valores por producto */}
                        {PRODUCT_KEYS.map((key) => {
                          const opVal = entry.operatorStock?.[key] ?? 0;
                          // const adjVal = entry.adminAdjustment?.[key] ?? 0;
                          const finalVal = entry.finalStock?.[key] ?? opVal;
                          const subs = TAMBORES_DETAIL[key];

                          return (
                            <TableCell key={key} className="text-right">
                              <div className="flex items-center justify-center">
                                {/* Total */}
                                <span className="font-medium">{finalVal}</span>
                                {/* {hasAdminAdj && adjVal !== 0 && (
                                  <DiffBadge value={adjVal} />
                                )} */}

                                {/* Subcategorías de tambores */}
                                {/* {subs && (
                                  <div className="flex flex-col items-end gap-0 mt-0.5">
                                    {subs.map(({ key: sk, label }) => {
                                      const sv =
                                        entry.finalStock?.[sk] ??
                                        entry.operatorStock?.[sk] ??
                                        0;
                                      return (
                                        <span
                                          key={sk}
                                          className={cn(
                                            "text-[10px]",
                                            label === "Dañados"
                                              ? "text-red-500"
                                              : label === "Vencidos"
                                                ? "text-orange-500"
                                                : "text-green-600",
                                          )}
                                        >
                                          {label}: {sv}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )} */}
                              </div>
                            </TableCell>
                          );
                        })}

                        {/* Exportar */}
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => exportEntry(entry)}
                            title={`Exportar ${formatEntryDate(entry)}`}
                            className="gap-1.5 text-green-700 hover:text-green-800 hover:bg-green-50"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="text-xs hidden sm:inline cursor-pointer">
                              Excel
                            </span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
