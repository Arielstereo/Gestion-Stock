"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  History,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStock, PRODUCT_KEYS, PRODUCT_LABELS } from "@/context/StockContext";
import { cn } from "@/lib/utils";
import LoadingButton from "@/components/LoadingButton";

// ── Constantes ────────────────────────────────────────────────────────────
const MOVEMENT_TYPES = [
  { value: "compra", label: "Compra", sign: +1 },
  { value: "consumo", label: "Consumo", sign: -1 },
];
const SERVICE_TYPES = [
  { value: "acondicionamiento", label: "Acondicionamiento" },
  { value: "exportacion", label: "Exportación" },
];
const emptyMovement = () => ({
  product: "",
  movementType: "",
  quantity: "",
  service: "",
  project: "",
});
// Para tambores y bolsones mostrar solo vigentes en columna "Operario"
const VIGENTES_MAP = {
  sobreTambores: "sobreTamboresVigentes",
  tamboresPcb: "tamboresPcbVigentes",
  tamboresPesticidas: "tamboresPesticidasVigentes",
  bolsonesPcb: "bolsonesPcbVigentes",
  bolsonesPesticidas: "bolsonesPesticidasVigentes",
};
const getOpValue = (stock, key) => {
  const subKey = VIGENTES_MAP[key];
  return subKey ? (stock?.[subKey] ?? 0) : (stock?.[key] ?? 0);
};

// ── Helpers ───────────────────────────────────────────────────────────────
const formatEntryDate = (entry, fmt = "MMMM yyyy") => {
  const year = Number(entry?.year);
  const month = Number(entry?.month);
  if (!year || !month || isNaN(year) || isNaN(month)) return "Sin fecha";
  return format(new Date(year, month - 1), fmt, { locale: es });
};

// Mes anterior: si es enero (1) → diciembre (12) del año anterior
const getPrevMonthYear = (month, year) => {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
};

// ── Badge diferencia ──────────────────────────────────────────────────────
function DiffBadge({ value, showZero = false }) {
  if ((!value || value === 0) && !showZero)
    return <span className="text-muted-foreground text-sm">—</span>;
  if (!value || value === 0)
    return <span className="text-muted-foreground text-sm">0</span>;
  const positive = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold text-sm",
        positive ? "text-green-600" : "text-red-600",
      )}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {value}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function AdminPage() {
  const { getSortedEntries, applyAdminAdjustment, isLoading } = useStock();
  const entries = getSortedEntries();

  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [movements, setMovements] = useState([emptyMovement()]);
  const [fieldErrors, setFieldErrors] = useState([{}]);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [negativeFields, setNegativeFields] = useState([]);

  const selectedEntry = entries.find((e) => e._id === selectedEntryId) || null;

  // ── Buscar entrada del mes anterior ──────────────────────────────────
  const prevEntry = useMemo(() => {
    if (!selectedEntry) return null;
    const { month, year } = getPrevMonthYear(
      selectedEntry.month,
      selectedEntry.year,
    );
    return entries.find((e) => e.month === month && e.year === year) || null;
  }, [selectedEntry, entries]);

  // ── Calcular diferencias operario actual vs final mes anterior ────────
  const monthDiffs = useMemo(() => {
    if (!selectedEntry || !prevEntry) return null;
    const diffs = {};
    let hasAnyDiff = false;
    for (const key of PRODUCT_KEYS) {
      const prevFinal =
        prevEntry.finalStock?.[key] ?? prevEntry.operatorStock?.[key] ?? 0;
      const currOp = getOpValue(selectedEntry.operatorStock, key);
      const diff = currOp - prevFinal;
      diffs[key] = { prevFinal, currOp, diff };
      if (diff !== 0) hasAnyDiff = true;
    }
    return { diffs, hasAnyDiff };
  }, [selectedEntry, prevEntry]);

  // ── Gestión de filas de movimiento ────────────────────────────────────
  const addMovement = () => {
    setMovements((p) => [...p, emptyMovement()]);
    setFieldErrors((p) => [...p, {}]);
  };
  const removeMovement = (i) => {
    setMovements((p) => p.filter((_, idx) => idx !== i));
    setFieldErrors((p) => p.filter((_, idx) => idx !== i));
  };
  const updateMovement = (i, field, value) => {
    setMovements((p) =>
      p.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    );
    setFieldErrors((p) =>
      p.map((e, idx) => {
        if (idx !== i) return e;
        const n = { ...e };
        delete n[field];
        return n;
      }),
    );
  };

  // ── Validación ────────────────────────────────────────────────────────
  const validate = () => {
    const errors = movements.map((m) => {
      const e = {};
      if (!m.product) e.product = "Requerido";
      if (!m.movementType) e.movementType = "Requerido";
      if (!m.quantity || isNaN(Number(m.quantity)) || Number(m.quantity) <= 0)
        e.quantity = "Debe ser > 0";
      if (!m.service) e.service = "Requerido";
      return e;
    });
    setFieldErrors(errors);
    return errors.every((e) => Object.keys(e).length === 0);
  };

  const buildPayload = () => {
    const adj = Object.fromEntries(PRODUCT_KEYS.map((k) => [k, 0]));
    for (const m of movements) {
      const sign =
        MOVEMENT_TYPES.find((t) => t.value === m.movementType)?.sign ?? 1;
      adj[m.product] = (adj[m.product] || 0) + sign * Number(m.quantity);
    }
    return adj;
  };

  const buildNote = () =>
    movements
      .map((m) => {
        const type =
          MOVEMENT_TYPES.find((t) => t.value === m.movementType)?.label ??
          m.movementType;
        const service =
          SERVICE_TYPES.find((s) => s.value === m.service)?.label ?? m.service;
        const product = PRODUCT_LABELS[m.product] ?? m.product;
        return `${type} ${m.quantity} ${product} | Serv: ${service}${m.project ? ` | Proy: ${m.project}` : ""}`;
      })
      .join("\n");

  // ── Submit ─────────────────────────────────────────────────────────────
  const validateNegatives = (payload) => {
    const VIGENTES_MAP = {
      sobreTambores: "sobreTamboresVigentes",
      tamboresPcb: "tamboresPcbVigentes",
      tamboresPesticida: "tamboresPesticidaVigentes",
      bolsonesPcb: "bolsonesPcbVigentes",
      bolsonesPesticida: "bolsonesPesticidaVigentes",
    };
    const negatives = [];
    for (const key of PRODUCT_KEYS) {
      const subKey = VIGENTES_MAP[key];
      const current = subKey
        ? (selectedEntry.operatorStock?.[subKey] ?? 0)
        : (selectedEntry.operatorStock?.[key] ?? 0);
      const prevAdj = selectedEntry.adminAdjustment?.[key] ?? 0;
      const newAdj = payload[key] ?? 0;
      if (current + prevAdj + newAdj < 0) negatives.push(key);
    }
    return negatives;
  };

  const handleSubmit = async () => {
    if (!selectedEntry || !validate()) return;
    setApiError("");
    setSuccess(false);
    setNegativeFields([]);

    const payload = buildPayload();
    const negatives = validateNegatives(payload);
    if (negatives.length > 0) {
      setNegativeFields(negatives);
      return;
    }

    setIsSubmitting(true);
    const result = await applyAdminAdjustment(
      selectedEntry._id,
      payload,
      buildNote(),
    );
    setIsSubmitting(false);
    if (result.success) {
      setSuccess(true);
      setNegativeFields([]);
      setMovements([emptyMovement()]);
      setFieldErrors([{}]);
    } else {
      setApiError(result.error);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SlidersHorizontal className="h-6 w-6 text-primary" />
          Panel Administrador
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registrá movimientos y aplicá ajustes al conteo del operario
        </p>
      </div>

      {/* ── Selector de período ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleccionar período</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay registros. El operario debe cargar el stock primero.
            </p>
          ) : (
            <Select
              value={selectedEntryId}
              onValueChange={(v) => {
                setSelectedEntryId(v);
                setSuccess(false);
                setApiError("");
                setMovements([emptyMovement()]);
                setFieldErrors([{}]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un mes..." />
              </SelectTrigger>
              <SelectContent>
                {entries.map((e) => {
                  const label = formatEntryDate(e);
                  return (
                    <SelectItem key={e._id} value={e._id}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                      {e.adminSubmittedAt ? " ✓" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedEntry && (
        <>
          {/* ── Alerta de diferencias vs mes anterior ───────────────────── */}
          {monthDiffs?.hasAnyDiff && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Diferencias respecto a{" "}
                  <span className="capitalize">
                    {formatEntryDate(prevEntry)}
                  </span>
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  El conteo del mes actual difiere del stock final del mes
                  anterior.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-yellow-200">
                      <th className="text-left py-2 font-medium text-yellow-700">
                        Producto
                      </th>
                      <th className="text-right py-2 font-medium text-yellow-700">
                        Final {formatEntryDate(prevEntry, "MMM yy")}
                      </th>
                      <th className="text-right py-2 font-medium text-yellow-700">
                        Conteo {formatEntryDate(selectedEntry, "MMM yy")}
                      </th>
                      <th className="text-right py-2 font-medium text-yellow-700">
                        Diferencia
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRODUCT_KEYS.map((key) => {
                      const { prevFinal, currOp, diff } = monthDiffs.diffs[key];
                      if (diff === 0) return null; // solo mostrar los que difieren
                      return (
                        <tr
                          key={key}
                          className="border-b border-yellow-100 last:border-0"
                        >
                          <td className="py-2 text-yellow-800">
                            {PRODUCT_LABELS[key]}
                          </td>
                          <td className="py-2 text-right font-mono text-yellow-800">
                            {prevFinal}
                          </td>
                          <td className="py-2 text-right font-mono text-yellow-800">
                            {currOp}
                          </td>
                          <td className="py-2 text-right">
                            <DiffBadge value={diff} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Sin mes anterior disponible */}
          {!prevEntry && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              No hay registro del mes anterior para comparar.
            </div>
          )}

          {/* Mes anterior existe y no hay diferencias */}
          {prevEntry && !monthDiffs?.hasAnyDiff && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              El conteo del mes actual coincide con el stock final de
              <span className="font-medium capitalize">
                {formatEntryDate(prevEntry)}
              </span>
            </div>
          )}

          {/* ── Tabla stock actual ───────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Stock actual del período
              </CardTitle>
              <CardDescription className="capitalize">
                {formatEntryDate(selectedEntry)}
                {selectedEntry.operatorSubmittedAt && (
                  <span className="ml-2 text-xs">
                    · Conteo:{" "}
                    {format(
                      new Date(selectedEntry.operatorSubmittedAt),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      Producto
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      Operario
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      Ajuste
                    </th>
                    <th className="text-right py-2 font-medium">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCT_KEYS.map((key) => {
                    const op = getOpValue(selectedEntry.operatorStock, key);
                    const adj = selectedEntry.adminAdjustment?.[key] ?? 0;
                    const fin = selectedEntry.finalStock?.[key] ?? op;
                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="py-2 text-muted-foreground">
                          {PRODUCT_LABELS[key]}
                        </td>
                        <td className="py-2 text-right font-mono">{op}</td>
                        <td className="py-2 text-right">
                          <DiffBadge value={adj} />
                        </td>
                        <td className="py-2 text-right font-bold">{fin}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {selectedEntry.adminNote && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 font-medium flex items-center gap-1 mb-1">
                    <History className="h-3 w-3" /> Movimientos registrados:
                  </p>
                  <pre className="text-xs text-yellow-800 whitespace-pre-wrap font-sans">
                    {selectedEntry.adminNote}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Formulario de movimientos ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar movimientos</CardTitle>
              <CardDescription>
                Cada fila es un movimiento. Podés agregar varios antes de
                guardar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {movements.map((m, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Movimiento {i + 1}
                    </span>
                    {movements.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeMovement(i)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Producto */}
                    <div className="space-y-1">
                      <Label className="text-xs">Producto</Label>
                      <Select
                        value={m.product}
                        onValueChange={(v) => updateMovement(i, "product", v)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10",
                            fieldErrors[i]?.product && "border-destructive",
                          )}
                        >
                          <SelectValue placeholder="Seleccioná..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_KEYS.map((key) => (
                            <SelectItem key={key} value={key}>
                              {PRODUCT_LABELS[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[i]?.product && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[i].product}
                        </p>
                      )}
                    </div>

                    {/* Tipo de movimiento */}
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo de movimiento</Label>
                      <Select
                        value={m.movementType}
                        onValueChange={(v) =>
                          updateMovement(i, "movementType", v)
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10",
                            fieldErrors[i]?.movementType &&
                              "border-destructive",
                          )}
                        >
                          <SelectValue placeholder="Seleccioná..." />
                        </SelectTrigger>
                        <SelectContent>
                          {MOVEMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.sign === 1 ? "➕" : "➖"} {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[i]?.movementType && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[i].movementType}
                        </p>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={m.quantity}
                        onChange={(e) =>
                          updateMovement(i, "quantity", e.target.value)
                        }
                        placeholder="0"
                        className={cn(
                          "h-10",
                          fieldErrors[i]?.quantity && "border-destructive",
                        )}
                      />
                      {fieldErrors[i]?.quantity && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[i].quantity}
                        </p>
                      )}
                    </div>

                    {/* Servicio */}
                    <div className="space-y-1">
                      <Label className="text-xs">Servicio</Label>
                      <Select
                        value={m.service}
                        onValueChange={(v) => updateMovement(i, "service", v)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10",
                            fieldErrors[i]?.service && "border-destructive",
                          )}
                        >
                          <SelectValue placeholder="Seleccioná..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_TYPES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[i]?.service && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[i].service}
                        </p>
                      )}
                    </div>

                    {/* Proyecto */}
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">
                        Proyecto{" "}
                        <span className="text-muted-foreground font-normal">
                          (opcional)
                        </span>
                      </Label>
                      <Input
                        type="text"
                        value={m.project}
                        onChange={(e) =>
                          updateMovement(i, "project", e.target.value)
                        }
                        placeholder="Nombre del proyecto..."
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Preview de la fila */}
                  {m.product && m.movementType && m.quantity && (
                    <div
                      className={cn(
                        "text-xs rounded px-2 py-1 font-medium",
                        MOVEMENT_TYPES.find((t) => t.value === m.movementType)
                          ?.sign === 1
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700",
                      )}
                    >
                      {MOVEMENT_TYPES.find((t) => t.value === m.movementType)
                        ?.sign === 1
                        ? "+"
                        : "−"}
                      {m.quantity} {PRODUCT_LABELS[m.product]}
                      {" · "}
                      {
                        MOVEMENT_TYPES.find((t) => t.value === m.movementType)
                          ?.label
                      }
                      {m.service &&
                        ` · ${SERVICE_TYPES.find((s) => s.value === m.service)?.label}`}
                      {m.project && ` · ${m.project}`}
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addMovement}
                className="w-full gap-2 border-dashed"
              >
                <Plus className="h-4 w-4" />
                Agregar otro movimiento
              </Button>

              {negativeFields.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    El ajuste dejaría stock negativo en:
                  </p>
                  <ul className="text-sm text-red-700 list-disc pl-5">
                    {negativeFields.map((k) => (
                      <li key={k}>{PRODUCT_LABELS[k]}</li>
                    ))}
                  </ul>
                </div>
              )}

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700">
                    Ajuste aplicado correctamente
                  </p>
                </div>
              )}

              <LoadingButton
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Guardando..."
                size="lg"
                className="w-full h-12 gap-2"
              >
                <SlidersHorizontal className="h-5 w-5" />
                Aplicar Ajustes
              </LoadingButton>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
