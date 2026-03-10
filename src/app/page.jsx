"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useStock, PRODUCT_KEYS, PRODUCT_LABELS } from "@/hooks/useStock";

export default function Home() {
  const currentDate = new Date();
  const currentMonthYear = format(currentDate, "MMMM yyyy", { locale: es });
  const { entries, getLatestEntry, isLoading } = useStock();
  const latestEntry = getLatestEntry();

  const formatEntryDate = (entry, fmt = "MMM yyyy") => {
    const year = Number(entry?.year);
    const month = Number(entry?.month);
    if (!year || !month || isNaN(year) || isNaN(month)) return "Sin fecha";
    return format(new Date(year, month - 1), fmt, { locale: es });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl mb-32">
      {/* Welcome Section */}
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Gestión Stock Depósito
        </h1>
        <p className="text-2xl text-black capitalize">{currentMonthYear}</p>
      </div>

      {/* Action Buttons */}
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

      {/* Latest Entry Preview */}
      {latestEntry && (
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
            <div className="flex flex-col gap-2 text-sm">
              {PRODUCT_KEYS.map((key, i) => (
                <div
                  key={key}
                  className={`flex justify-between py-1 border-b ${
                    i === PRODUCT_KEYS.length - 1 ? "col-span-2 border-0" : ""
                  }`}
                >
                  <span className="text-muted-foreground">
                    {PRODUCT_LABELS[key]}
                  </span>
                  <span className="font-bold text-blue-600">
                    {latestEntry.finalStock?.[key] ??
                      latestEntry.operatorStock?.[key] ??
                      0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
