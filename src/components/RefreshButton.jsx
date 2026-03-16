"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useStock } from "@/context/StockContext";
import { cn } from "@/lib/utils";

export default function RefreshButton() {
  const { loadEntries } = useStock();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = async () => {
    if (spinning) return;
    setSpinning(true);
    await loadEntries();
    setSpinning(false);
  };

  return (
    <button
      onClick={handleRefresh}
      title="Actualizar datos"
      className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-primary-foreground/20 font-medium hover:bg-white text-sm border border-white text-primary-foreground hover:text-blue-600 cursor-pointer"
    >
      <RefreshCw className={cn("h-4 w-4", spinning && "animate-spin")} />
      <span className="hidden lg:inline">Actualizar</span>
    </button>
  );
}
