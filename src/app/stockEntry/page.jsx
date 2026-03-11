"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, AlertCircle, CheckCircle2, Pencil } from "lucide-react";
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

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Productos que tienen subcategorías (vigentes/dañados/vencidos)
const TAMBORES_GROUPS = [
  {
    key: "tamboresPcb",
    subs: [
      { key: "tamboresPcbVigentes", label: "Vigentes" },
      { key: "tamboresPcbDaniados", label: "Dañados" },
      { key: "tamboresPcbVencidos", label: "Vencidos" },
    ],
  },
  {
    key: "tamboresPesticida",
    subs: [
      { key: "tamboresPesticidaVigentes", label: "Vigentes" },
      { key: "tamboresPesticidaDaniados", label: "Dañados" },
      { key: "tamboresPesticidaVencidos", label: "Vencidos" },
    ],
  },
];

const TAMBORES_KEYS = TAMBORES_GROUPS.map((g) => g.key);
const ALL_SUB_KEYS = TAMBORES_GROUPS.flatMap((g) => g.subs.map((s) => s.key));
// Productos simples (sin subcategorías)
const SIMPLE_KEYS = PRODUCT_KEYS.filter((k) => !TAMBORES_KEYS.includes(k));

// Estado vacío del formulario
const emptyStock = () => ({
  ...Object.fromEntries(SIMPLE_KEYS.map((k) => [k, ""])),
  ...Object.fromEntries(ALL_SUB_KEYS.map((k) => [k, ""])),
});

// Total de un grupo de tambores
const calcGroup = (products, group) =>
  group.subs.reduce((acc, s) => acc + (Number(products[s.key]) || 0), 0);

// Construir payload para la API:
// - tamboresPcb / tamboresPesticida = suma de sus subs
// - los detalles de subs también se guardan en operatorStock
const buildPayload = (products) => ({
  ...Object.fromEntries(SIMPLE_KEYS.map((k) => [k, Number(products[k]) || 0])),
  ...TAMBORES_GROUPS.reduce((acc, group) => {
    acc[group.key] = calcGroup(products, group);
    group.subs.forEach((s) => {
      acc[s.key] = Number(products[s.key]) || 0;
    });
    return acc;
  }, {}),
});

// Pre-cargar valores de un entry existente al form
const entryToForm = (op = {}) => ({
  ...Object.fromEntries(SIMPLE_KEYS.map((k) => [k, String(op[k] ?? "")])),
  ...Object.fromEntries(ALL_SUB_KEYS.map((k) => [k, String(op[k] ?? "")])),
});

export default function StockEntryPage() {
  const router = useRouter();
  const {
    createOperatorEntry,
    updateOperatorEntry,
    getEntryByMonthYear,
    isLoading,
  } = useStock();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [products, setProducts] = useState(emptyStock());
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [conflictEntry, setConflictEntry] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const selectedMonthLabel = format(
    setYear(setMonth(new Date(), selectedMonth - 1), selectedYear),
    "MMMM yyyy",
    { locale: es },
  );

  // Chequear conflicto al cambiar mes/año
  useEffect(() => {
    const existing = getEntryByMonthYear(selectedMonth, selectedYear);
    setConflictEntry(existing || null);
    setEditMode(false);
    setProducts(emptyStock());
    setFieldErrors({});
    setApiError("");
  }, [selectedMonth, selectedYear, getEntryByMonthYear]);

  const handleStartEdit = () => {
    if (!conflictEntry?.operatorStock) return;
    setProducts(entryToForm(conflictEntry.operatorStock));
    setEditMode(true);
  };

  const handleProductChange = (key, value) => {
    setProducts((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    const allFields = [...SIMPLE_KEYS, ...ALL_SUB_KEYS];
    for (const key of allFields) {
      const val = products[key];
      if (val === "" || val === null || val === undefined) {
        errors[key] = "Requerido";
      } else if (isNaN(Number(val)) || Number(val) < 0) {
        errors[key] = "Debe ser >= 0";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setApiError("");

    const payload = buildPayload(products);

    const result =
      editMode && conflictEntry
        ? await updateOperatorEntry(conflictEntry._id, payload)
        : await createOperatorEntry(selectedMonth, selectedYear, payload);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } else {
      setApiError(result.error);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="text-lg font-semibold text-green-700">
              Stock guardado correctamente
            </p>
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBlocked = !!conflictEntry && !editMode;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl mb-32">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Cargar Stock Mensual
          </CardTitle>
          <CardDescription>
            Ingresá el conteo físico de cada producto en el depósito.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Selector mes/año */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 5 },
                    (_, i) => currentDate.getFullYear() + i,
                  ).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Banner período */}
          <div
            className={cn(
              "rounded-lg p-4 border space-y-3",
              isBlocked
                ? "bg-yellow-50 border-yellow-300"
                : editMode
                  ? "bg-orange-50 border-orange-300"
                  : "bg-blue-50 border-blue-200",
            )}
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Período seleccionado
              </p>
              <p
                className={cn(
                  "font-semibold capitalize text-lg",
                  isBlocked
                    ? "text-yellow-800"
                    : editMode
                      ? "text-orange-800"
                      : "text-blue-800",
                )}
              >
                {selectedMonthLabel}
              </p>
            </div>

            {/* Conflicto: resumen + botón editar */}
            {isBlocked && (
              <div className="space-y-2">
                <p className="text-xs text-yellow-700 flex items-center gap-1 justify-center">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  Este mes ya tiene un conteo cargado.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-yellow-400 text-yellow-800 hover:bg-yellow-100 gap-2 cursor-pointer"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-3 w-3" />
                  Editar este conteo
                </Button>
              </div>
            )}

            {editMode && (
              <p className="text-xs text-orange-700 text-center flex items-center justify-center gap-1">
                <Pencil className="h-3 w-3" />
                Editando conteo existente — se reemplazarán los valores
                guardados
              </p>
            )}
          </div>

          {/* Formulario */}
          <fieldset
            disabled={isBlocked}
            className={cn(
              "space-y-6",
              isBlocked && "opacity-40 pointer-events-none select-none",
            )}
          >
            {/* Grupos de tambores con subcategorías */}
            {TAMBORES_GROUPS.map((group) => {
              const total = calcGroup(products, group);
              return (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <Label className="text-base font-semibold">
                      {PRODUCT_LABELS[group.key]}
                    </Label>
                    {total > 0 && (
                      <span className="text-sm text-muted-foreground">
                        (Total: {total})
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 pl-1">
                    {group.subs.map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <Label
                          htmlFor={key}
                          className="text-xs text-muted-foreground"
                        >
                          {label}
                        </Label>
                        <Input
                          id={key}
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={products[key]}
                          onChange={(e) =>
                            handleProductChange(key, e.target.value)
                          }
                          placeholder="0"
                          className={cn(
                            "h-11 text-base",
                            fieldErrors[key] && "border-destructive",
                          )}
                        />
                        {fieldErrors[key] && (
                          <p className="text-xs text-destructive">
                            {fieldErrors[key]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="border-t" />

            {/* Productos simples */}
            {SIMPLE_KEYS.map((key) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{PRODUCT_LABELS[key]}</Label>
                <Input
                  id={key}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={products[key]}
                  onChange={(e) => handleProductChange(key, e.target.value)}
                  placeholder="0"
                  className={cn(
                    "h-12 text-lg",
                    fieldErrors[key] &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {fieldErrors[key] && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors[key]}
                  </p>
                )}
              </div>
            ))}
          </fieldset>

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading || isBlocked}
            size="lg"
            className={cn(
              "w-full h-14 text-lg",
              editMode
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-800 hover:bg-blue-600",
            )}
          >
            {isLoading
              ? "Guardando..."
              : editMode
                ? "Guardar cambios"
                : "Guardar Stock"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
