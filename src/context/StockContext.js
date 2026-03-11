"use client";

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
} from "react";
import axios from "axios";

export const PRODUCT_KEYS = [
  "tamboresPcb",
  "tamboresPesticida",
  "palletsBigBag",
  "palletsTambores",
  "tirantes",
  "tablas",
  "absorbente",
  "bolsonesPcb",
  "bolsonesPesticida",
];

export const PRODUCT_LABELS = {
  tamboresPcb: "Tambores PCB",
  tamboresPesticida: "Tambores Pesticida",
  palletsBigBag: "Pallets para Big Bag",
  palletsTambores: "Pallets para Tambores",
  tirantes: "Tirantes",
  tablas: "Tablas",
  absorbente: "Absorbente",
  bolsonesPcb: "Bolsones PCB",
  bolsonesPesticida: "Bolsones Pesticida",
};

const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // true hasta q termine el primer fetch
  const [error, setError] = useState(null);

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

  // Un solo fetch al montar el provider
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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

  const getSortedEntries = useCallback(
    () =>
      [...entries].sort((a, b) =>
        b.year !== a.year ? b.year - a.year : b.month - a.month,
      ),
    [entries],
  );

  const getLatestEntry = useCallback(
    () => getSortedEntries()[0] ?? null,
    [getSortedEntries],
  );

  const getEntryByMonthYear = useCallback(
    (month, year) =>
      entries.find((e) => e.month === month && e.year === year) ?? null,
    [entries],
  );

  const getDiff = useCallback((entry) => {
    if (!entry) return null;
    return Object.fromEntries(
      PRODUCT_KEYS.map((k) => [k, entry.adminAdjustment?.[k] || 0]),
    );
  }, []);

  return (
    <StockContext.Provider
      value={{
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
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock debe usarse dentro de <StockProvider>");
  return ctx;
}
