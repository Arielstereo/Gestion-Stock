import { create } from "zustand";
import axios from "axios";

// The store still keeps a small in‑memory cache but the source of truth
// becomes the backend API.  Actions return promises where appropriate.
export const useStockAdjustmentStore = create((set, get) => ({
  adjustments: {},
  loading: false,
  error: null,

  // synchronous helpers for totals/lookup
  getTotalAdjustmentForProduct: (productKey) => {
    const arr = get().adjustments[productKey] || [];
    return arr.reduce((sum, adj) => sum + adj.amount, 0);
  },

  getProductAdjustments: (productKey) => {
    return get().adjustments[productKey] || [];
  },

  getAllAdjustments: () => get().adjustments,

  getAdjustmentTotals: () => {
    const adjustments = get().adjustments;
    const totals = {};
    Object.keys(adjustments).forEach((key) => {
      totals[key] = adjustments[key].reduce(
        (sum, adj) => sum + adj.amount,
        0,
      );
    });
    return totals;
  },

  ///////////////////////////////////////
  // async actions against API
  ///////////////////////////////////////
  loadAdjustments: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/api/adjustments");
      // group by productKey to maintain previous shape
      const grouped = res.data.reduce((acc, adj) => {
        const key = adj.productKey;
        if (!acc[key]) acc[key] = [];
        acc[key].push(adj);
        return acc;
      }, {});
      set({ adjustments: grouped, loading: false });
    } catch (err) {
      console.error(err);
      set({ error: err, loading: false });
    }
  },

  addAdjustment: async (
    productKey,
    amount,
    partner = "",
    service = "",
    type = "adjustment",
  ) => {
    if (!productKey || amount === 0) return false;
    const now = new Date().toISOString();
    const payload = { productKey, amount, partner, service, type, date: now };
    try {
      const res = await axios.post("/api/adjustments", payload);
      const adj = res.data;
      set((state) => ({
        adjustments: {
          ...state.adjustments,
          [productKey]: [...(state.adjustments[productKey] || []), adj],
        },
      }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  clearAdjustments: async (productKey = null) => {
    try {
      if (productKey) {
        await axios.delete(
          `/api/adjustments?productKey=${encodeURIComponent(productKey)}`,
        );
        set((state) => ({
          adjustments: { ...state.adjustments, [productKey]: [] },
        }));
      } else {
        await axios.delete("/api/adjustments");
        set({ adjustments: {} });
      }
    } catch (err) {
      console.error(err);
    }
  },

  undoAdjustment: async (adjustmentId) => {
    try {
      await axios.delete(`/api/adjustments/${adjustmentId}`);
      set((state) => {
        const newAdjustments = { ...state.adjustments };
        Object.keys(newAdjustments).forEach((key) => {
          newAdjustments[key] = newAdjustments[key].filter(
            (adj) => adj._id !== adjustmentId && adj.id !== adjustmentId,
          );
        });
        return { adjustments: newAdjustments };
      });
    } catch (err) {
      console.error(err);
    }
  },
}));

// pre‑load adjustments cache when module is imported
useStockAdjustmentStore.getState().loadAdjustments();
