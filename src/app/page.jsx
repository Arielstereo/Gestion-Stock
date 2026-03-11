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
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useStock, PRODUCT_KEYS, PRODUCT_LABELS } from "@/context/StockContext";

// Subcategorías por cada grupo de tambores
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
  const subs = TAMBORES_DETAIL[productKey];

  return (
    <div className={`py-1 ${!isLast ? "border-b" : ""}`}>
      {/* Fila principal */}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">
          {PRODUCT_LABELS[productKey]}
        </span>
        <span className="font-bold text-blue-600">{total}</span>
      </div>

      {/* Subcategorías de tambores */}
      {subs && (
        <div className="flex gap-3 mt-1 pl-2">
          {subs.map(({ key, label }) => {
            const val = stock[key] ?? 0;
            return (
              <span key={key} className="text-xs text-muted-foreground">
                {label}:{" "}
                <span
                  className={`font-semibold ${
                    label === "Dañados"
                      ? "text-red-500"
                      : label === "Vencidos"
                        ? "text-orange-500"
                        : "text-green-600"
                  }`}
                >
                  {val}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const currentDate = new Date();
  const currentMonthYear = format(currentDate, "MMMM yyyy", { locale: es });
  const { getLatestEntry, isLoading } = useStock();
  const latestEntry = getLatestEntry();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl mb-32">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Gestión Stock Depósito
        </h1>
        <p className="text-2xl text-black capitalize">{currentMonthYear}</p>
      </div>

      <div className="space-y-4 md:hidden">
        <Link href="/stockEntry" className="block">
          <Button
            size="lg"
            className="w-full bg-blue-800 hover:bg-blue-600 cursor-pointer h-16 text-lg gap-3 shadow-md"
          >
            Cargar Stock Mensual
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center mt-16 p-8 gap-4">
          <Image
            src="/tredi-blanco.png"
            alt="Cargando..."
            width={160}
            height={60}
            className="w-40 h-auto opacity-20 animate-pulse"
          />
        </div>
      ) : latestEntry ? (
        <Card className="my-8 md:my-16">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Último Stock Cargado
            </CardTitle>
            <CardDescription className="capitalize">
              {formatEntryDate(latestEntry, "MMMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-0 text-sm">
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
        <div className="flex gap-2 justify-center items-center mt-16 p-8 bg-amber-50 border border-amber-300 rounded-xl">
          <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
          <span className="text-amber-600 text-base text-center">
            No hay stock cargado.
          </span>
        </div>
      )}
    </div>
  );
}
