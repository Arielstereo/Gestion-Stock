"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  X,
  Package,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_LABELS } from "@/context/StockContext";
import { cn } from "@/lib/utils";

// ── Configuración de subcategorías por producto ───────────────────────────
const PRODUCT_GROUPS = [
  {
    key: "bolsonesPcb",
    subs: [
      {
        key: "bolsonesPcbVigentes",
        label: "Vigentes",
        icon: CheckCircle2,
        color: "text-black",
      },
      {
        key: "bolsonesPcbVencidos",
        label: "Vencidos",
        icon: XCircle,
        color: "text-muted-foreground",
      },
    ],
  },
  {
    key: "bolsonesPesticida",
    subs: [
      {
        key: "bolsonesPesticidaVigentes",
        label: "Vigentes",
        icon: CheckCircle2,
        color: "text-black",
      },
      {
        key: "bolsonesPesticidaVencidos",
        label: "Vencidos",
        icon: XCircle,
        color: "text-muted-foreground",
      },
    ],
  },
  {
    key: "tamboresPcb",
    subs: [
      {
        key: "tamboresPcbVigentes",
        label: "Vigentes",
        icon: CheckCircle2,
        color: "text-black",
      },
      {
        key: "tamboresPcbDaniados",
        label: "Dañados",
        icon: AlertTriangle,
        color: "text-muted-foreground",
      },
      {
        key: "tamboresPcbVencidos",
        label: "Vencidos",
        icon: XCircle,
        color: "text-muted-foreground",
      },
    ],
  },
  {
    key: "tamboresPesticida",
    subs: [
      {
        key: "tamboresPesticidaVigentes",
        label: "Vigentes",
        icon: CheckCircle2,
        color: "text-black",
      },
      {
        key: "tamboresPesticidaDaniados",
        label: "Dañados",
        icon: AlertTriangle,
        color: "text-muted-foreground",
      },
      {
        key: "tamboresPesticidaVencidos",
        label: "Vencidos",
        icon: XCircle,
        color: "text-muted-foreground",
      },
    ],
  },
  // Productos simples (sin subcategorías)
  { key: "absorbente" },
  { key: "bines" },
  { key: "palletsBigBag" },
  { key: "palletsTambores" },
  { key: "tablas" },
  { key: "tirantes" },
];

const SIMPLE_KEYS = [
  "absorbente",
  "bines",
  "palletsBigBag",
  "palletsTambores",
  "tirantes",
  "tablas",
];

const formatDate = (entry) => {
  const y = Number(entry?.year);
  const m = Number(entry?.month);
  if (!y || !m) return "Sin fecha";
  return format(new Date(y, m - 1), "MMMM yyyy", { locale: es });
};

// Parsear los movimientos del adminNote
const parseMovements = (adminNote = "") => {
  if (!adminNote.trim()) return [];
  const blocks = adminNote.split(/---[^-]+---/).filter(Boolean);
  const movements = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      // Formato: "Compra: Tambores PCB +5 (Exportación - Proyecto X)"
      const match = line.match(
        /^(Compra|Consumo):\s(.+?)\s([+-]\d+)(?:\s\((.+)\))?$/,
      );
      if (match) {
        movements.push({
          type: match[1],
          product: match[2],
          qty: parseInt(match[3]),
          detail: match[4] || "",
        });
      }
    }
  }
  return movements;
};

function SubRow({ sub, value }) {
  const Icon = sub.icon;
  return (
    <div className="flex items-center justify-between py-1 pl-6 border-b border-dashed last:border-0">
      <div className={cn("flex items-center gap-1.5 text-sm", sub.color)}>
        <Icon className="h-3.5 w-3.5" />
        <span>{sub.label}</span>
      </div>
      <span className={cn("font-semibold text-sm tabular-nums", sub.color)}>
        {value}
      </span>
    </div>
  );
}

function ProductCard({ group, entry }) {
  const op = entry.operatorStock ?? {};
  const final = entry.finalStock ?? op;
  const adj = entry.adminAdjustment ?? {};

  const totalFinal = final[group.key] ?? 0;
  const adjVal = adj[group.key] ?? 0;
  const isSimple = SIMPLE_KEYS.includes(group.key);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header del producto */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
            {PRODUCT_LABELS[group.key]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {adjVal !== 0 && (
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-0.5",
                adjVal > 0 ? "text-green-600" : "text-red-500",
              )}
            >
              {adjVal > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {adjVal > 0 ? "+" : ""}
              {adjVal}
            </span>
          )}
          <span className="text-lg font-bold text-black tabular-nums">
            {totalFinal}
          </span>
        </div>
      </div>

      {/* Subcategorías */}
      {!isSimple && group.subs && (
        <div className="px-4 py-1">
          {group.subs.map((sub) => (
            <SubRow key={sub.key} sub={sub} value={op[sub.key] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntryStats({ entry, onClose }) {
  if (!entry) return null;

  const movements = parseMovements(entry.adminNote);
  const hasAdj = !!entry.adminSubmittedAt;
  const periodLabel = formatDate(entry);
  const capitalizado =
    periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50">
        <div className="bg-background w-full md:max-w-xl md:rounded-2xl md:shadow-2xl max-h-[90vh] flex flex-col rounded-t-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-blue-800 text-white md:rounded-t-2xl rounded-t-2xl">
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                Detalle de stock
              </p>
              <h2 className="text-lg font-bold capitalize">{capitalizado}</h2>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Contenido scrolleable */}
          <div className="overflow-y-auto flex-1 p-4 space-y-5">
            {/* Badge ajustado */}
            {hasAdj && (
              <div className="flex items-center gap-2 text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-yellow-800">
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                Este período tiene ajustes administrativos aplicados. El stock
                final refleja solo los vigentes más los ajustes.
              </div>
            )}

            {/* Grilla de productos */}
            <div className="space-y-3">
              {PRODUCT_GROUPS.map((group) => (
                <ProductCard key={group.key} group={group} entry={entry} />
              ))}
            </div>

            {/* Movimientos registrados */}
            {movements.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Movimientos registrados
                </h3>
                <div className="space-y-1.5">
                  {movements.map((mv, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start justify-between rounded-lg px-3 py-2 text-sm border",
                        mv.type === "Compra"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {mv.type === "Compra" ? (
                          <ShoppingCart className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-medium">{mv.product}</span>
                          {mv.detail && (
                            <p className="text-xs text-muted-foreground">
                              {mv.detail}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "font-bold tabular-nums shrink-0 ml-2",
                          mv.qty > 0 ? "text-green-600" : "text-red-500",
                        )}
                      >
                        {mv.qty > 0 ? "+" : ""}
                        {mv.qty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nota admin cruda si no se pudo parsear */}
            {entry.adminNote && movements.length === 0 && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-muted-foreground pl-2 tracking-wide">
                  Movimientos registrados del mes:
                </h3>
                <pre className="text-xs rounded-lg p-3 whitespace-pre-wrap font-sans bg-yellow-100 border border-yellow-300 text-yellow-800">
                  {entry.adminNote}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t">
            <Button
              onClick={onClose}
              className="w-full bg-blue-800 hover:bg-blue-600 cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
