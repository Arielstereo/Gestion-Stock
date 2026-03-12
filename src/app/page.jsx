"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useStock, PRODUCT_KEYS, PRODUCT_LABELS } from "@/context/StockContext";

const formatEntryDate = (entry, fmt = "MMM yyyy") => {
  const year = Number(entry?.year);
  const month = Number(entry?.month);
  if (!year || !month || isNaN(year) || isNaN(month)) return "Sin fecha";
  return format(new Date(year, month - 1), fmt, { locale: es });
};

// Fila de un producto — con detalle de subs si corresponde
function ProductRow({ productKey, entry, isLast }) {
  const stock = entry.finalStock ?? entry.operatorStock ?? {};
  const total = stock[productKey] ?? 0;

  return (
    <div className={`py-1 ${!isLast ? "border-b" : ""}`}>
      {/* Fila principal */}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">
          {PRODUCT_LABELS[productKey]}
        </span>
        <span className="font-bold text-black">{total}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const currentDate = new Date();
  const currentMonthYear = format(currentDate, "MMMM yyyy", { locale: es });
  const { getLatestEntry, isLoading } = useStock();
  const latestEntry = getLatestEntry();

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
    <div className="container mx-auto px-4 py-6 max-w-2xl mb-32">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Gestión Stock Depósito
        </h1>
        <p className="text-2xl text-muted-foreground font-bold capitalize">
          Período: {currentMonthYear}
        </p>
      </div>

      <div className="space-y-4 md:hidden">
        <Link href="/stockEntry" className="block">
          <Button
            size="lg"
            className="w-full bg-[#e07026] hover:bg-[#c65b1f] cursor-pointer h-16 text-lg gap-3 shadow-md"
          >
            Cargar Stock Mensual
          </Button>
        </Link>
      </div>

      {latestEntry ? (
        <Card className="my-8 md:my-16 border border-slate-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md">
              <Clock className="h-5 w-5" />
              Último Stock Cargado
            </CardTitle>
            <CardDescription className="capitalize text-green-600 text-center text-lg border border-green-300 bg-green-50 mt-2 py-1 rounded-md">
              {formatEntryDate(latestEntry, "MMMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-0 text-lg">
              {PRODUCT_KEYS.map((key, i) => (
                <ProductRow
                  key={key}
                  productKey={key}
                  entry={latestEntry}
                  isLast={i === PRODUCT_KEYS.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2 justify-center items-center mt-16 p-8 bg-blue-50 border border-blue-300 rounded-xl">
          <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
          <span className="text-blue-600 text-base text-center">
            No hay stock cargado.
          </span>
        </div>
      )}
    </div>
  );
}
