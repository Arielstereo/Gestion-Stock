"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useStock, PRODUCT_KEYS, PRODUCT_LABELS } from "@/hooks/useStock";
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

const emptyStock = () => Object.fromEntries(PRODUCT_KEYS.map((k) => [k, ""]));

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
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictEntry, setConflictEntry] = useState(null);

  const years = Array.from(
    { length: 5 },
    (_, i) => currentDate.getFullYear() + i,
  );

  const selectedMonthLabel = format(
    setYear(setMonth(new Date(), selectedMonth - 1), selectedYear),
    "MMMM yyyy",
    { locale: es },
  );

  // Verificar conflicto ni bien cambia el selector
  const checkConflict = (month, year) => {
    const existing = getEntryByMonthYear(month, year);
    if (existing) {
      setConflictEntry(existing);
      setShowConflictDialog(true);
    } else {
      setConflictEntry(null);
    }
  };

  const handleMonthChange = (v) => {
    const month = parseInt(v, 10);
    setSelectedMonth(month);
    checkConflict(month, selectedYear);
  };

  const handleYearChange = (v) => {
    const year = parseInt(v, 10);
    setSelectedYear(year);
    checkConflict(selectedMonth, year);
  };

  // El operario elige continuar: pre-carga los valores guardados en el form
  const handleKeepEditing = () => {
    if (conflictEntry?.operatorStock) {
      const preloaded = Object.fromEntries(
        PRODUCT_KEYS.map((k) => [
          k,
          String(conflictEntry.operatorStock[k] ?? ""),
        ]),
      );
      setProducts(preloaded);
    }
    setShowConflictDialog(false);
  };

  // El operario cancela: vuelve al mes actual
  const handleCancelAndReset = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setProducts(emptyStock());
    setConflictEntry(null);
    setShowConflictDialog(false);
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
    for (const key of PRODUCT_KEYS) {
      const val = products[key];
      if (val === "" || val === null || val === undefined) {
        errors[key] = "Campo requerido";
      } else if (isNaN(Number(val)) || Number(val) < 0) {
        errors[key] = "Debe ser un numero mayor o igual a 0";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildStockPayload = () =>
    Object.fromEntries(PRODUCT_KEYS.map((k) => [k, Number(products[k]) || 0]));

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setApiError("");

    // Si hay conflictEntry ya sabemos que existe -> actualizar directamente
    if (conflictEntry) {
      const result = await updateOperatorEntry(
        conflictEntry._id,
        buildStockPayload(),
      );
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 1500);
      } else {
        setApiError(result.error);
      }
      return;
    }

    const result = await createOperatorEntry(
      selectedMonth,
      selectedYear,
      buildStockPayload(),
    );
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl mb-32">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Cargar Stock Mensual
          </CardTitle>
          <CardDescription>
            Ingresa el conteo fisico de cada producto en el deposito.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Selector mes/año */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={handleMonthChange}
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
                onValueChange={handleYearChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período seleccionado — amarillo si ya fue cargado */}
          <div
            className={cn(
              "rounded-lg p-3 text-center border",
              conflictEntry
                ? "bg-yellow-50 border-yellow-300"
                : "bg-blue-50 border-blue-200",
            )}
          >
            <p className="text-sm text-muted-foreground">
              Periodo seleccionado
            </p>
            <p
              className={cn(
                "font-semibold capitalize",
                conflictEntry ? "text-yellow-800" : "text-blue-800",
              )}
            >
              {selectedMonthLabel}
            </p>
            {conflictEntry && (
              <p className="text-xs text-yellow-700 mt-1 flex items-center justify-center gap-1">
                Este mes ya tiene un conteo — vas a reemplazarlo
              </p>
            )}
          </div>

          {/* Campos de productos */}
          <div className="space-y-4">
            {PRODUCT_KEYS.map((key) => (
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
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className={cn(
              "w-full h-14 text-lg",
              conflictEntry
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-blue-800 hover:bg-blue-600",
            )}
          >
            {isLoading
              ? "Guardando..."
              : conflictEntry
                ? "Reemplazar conteo"
                : "Guardar Stock"}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog: mes ya cargado — aparece al elegir el mes */}
      <AlertDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              Este mes ya fue cargado
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ya existe un conteo de stock para{" "}
                  <span className="font-semibold capitalize text-foreground">
                    {selectedMonthLabel}
                  </span>
                  . ¿Queres cargar un nuevo conteo o cancelar?
                </p>

                {conflictEntry && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Conteo guardado actualmente:
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {PRODUCT_KEYS.map((key) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {PRODUCT_LABELS[key]}
                          </span>
                          <span className="font-semibold">
                            {conflictEntry.operatorStock?.[key] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Si continuas, los valores de arriba van a ser reemplazados con
                  lo que ingreses.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              className="flex-1"
              onClick={handleCancelAndReset}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKeepEditing}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              Continuar de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
