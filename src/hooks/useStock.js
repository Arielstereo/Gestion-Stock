import { useState, useCallback, useEffect } from "react";
import axios from "axios";

export const PRODUCT_KEYS = [
  "tambores",
  "tirantes",
  "bines",
  "bigBag",
  "absorventes",
  "palletsLivianos",
  "palletsPesados",
];

export const PRODUCT_LABELS = {
  tambores: "Tambores 200",
  tirantes: "Tirantes",
  bines: "Bines",
  bigBag: "Big Bag",
  absorventes: "Absorbentes",
  palletsLivianos: "Pallets Livianos",
  palletsPesados: "Pallets Pesados",
};

export function useStock() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Cargar todos los registros ──────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/entries");
      setEntries(res.data);
    } catch (err) {
      console.error("Error cargando entries:", err);
      setError(err?.response?.data?.error || "Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ─── Operario: crear nuevo registro mensual ───────────────────────────────
  // operatorStock: { tambores: 10, palletsLivianos: 5, ... }
  const createOperatorEntry = useCallback(
    async (month, year, operatorStock) => {
      setError(null);
      try {
        const res = await axios.post("/api/entries", {
          month,
          year,
          operatorStock,
        });
        setEntries((prev) => [res.data, ...prev]);
        return { success: true, data: res.data };
      } catch (err) {
        const message =
          err?.response?.data?.error || "Error al guardar el stock";
        const isConflict = err?.response?.status === 409;
        setError(message);
        return { success: false, error: message, isConflict };
      }
    },
    [],
  );

  // ─── Operario: actualizar conteo en un registro existente ────────────────
  const updateOperatorEntry = useCallback(async (id, operatorStock) => {
    setError(null);
    try {
      const res = await axios.put(`/api/entries/${id}`, { operatorStock });

      setEntries((prev) => prev.map((e) => (e._id === id ? res.data : e)));
      return { success: true, data: res.data };
    } catch (err) {
      const message =
        err?.response?.data?.error || "Error al actualizar el stock";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ─── Admin: aplicar ajuste (suma/resta) sobre el conteo del operario ─────
  // adminAdjustment: { tambores: -2, bigBag: 5, ... } (puede ser negativo)
  const applyAdminAdjustment = useCallback(
    async (id, adminAdjustment, adminNote = "") => {
      setError(null);
      try {
        const res = await axios.put(`/api/entries/${id}`, {
          adminAdjustment,
          adminNote,
        });
        setEntries((prev) => prev.map((e) => (e._id === id ? res.data : e)));
        return { success: true, data: res.data };
      } catch (err) {
        const message =
          err?.response?.data?.error || "Error al aplicar el ajuste";
        setError(message);
        return { success: false, error: message };
      }
    },
    [],
  );

  // ─── Eliminar registro ───────────────────────────────────────────────────
  const deleteEntry = useCallback(async (id) => {
    setError(null);
    try {
      await axios.delete(`/api/entries/${id}`);
      setEntries((prev) => prev.filter((e) => e._id !== id));
      return { success: true };
    } catch (err) {
      const message = err?.response?.data?.error || "Error al eliminar";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getSortedEntries = useCallback(() => {
    return [...entries].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [entries]);

  const getLatestEntry = useCallback(() => {
    return getSortedEntries()[0] || null;
  }, [getSortedEntries]);

  const getEntryByMonthYear = useCallback(
    (month, year) => {
      return entries.find((e) => e.month === month && e.year === year) || null;
    },
    [entries],
  );

  // Calcular diferencia entre finalStock y operatorStock (para mostrar al admin)
  const getDiff = useCallback((entry) => {
    if (!entry) return null;
    const diff = {};
    for (const key of PRODUCT_KEYS) {
      diff[key] = entry.adminAdjustment?.[key] || 0;
    }
    return diff;
  }, []);

  return {
    entries,
    isLoading,
    error,
    loadEntries,
    createOperatorEntry,
    updateOperatorEntry,
    applyAdminAdjustment,
    deleteEntry,
    getSortedEntries,
    getLatestEntry,
    getEntryByMonthYear,
    getDiff,
  };
}
