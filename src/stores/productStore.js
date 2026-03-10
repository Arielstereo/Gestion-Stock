import { create } from "zustand";
import axios from "axios";

// legacy constants used as a fallback until the server returns data
export const PRODUCT_LABELS = {
  tambores: "Tambores 200",
  palletsLivianos: "Pallets Livianos",
  palletsPesados: "Pallets Pesados",
  tirantes: "Tirantes con Tratamiento",
  bigBag: "Big Bag",
  absorventes: "Absorbentes",
  bines: "Bines",
};
export const PRODUCT_KEYS = Object.keys(PRODUCT_LABELS);

export const useProductStore = create((set, get) => ({
  // in‑memory cache, initially empty
  products: [],
  loading: false,
  error: null,

  // synchronous helpers the UI relies on
  getProductKeys: () => {
    const list = get().products;
    return list.length ? list.map((p) => p.key) : PRODUCT_KEYS;
  },

  getProductLabel: (key) => {
    const p = get().products.find((x) => x.key === key);
    return p ? p.label : PRODUCT_LABELS[key] || key;
  },

  getProductsWithInitialStock: () => {
    const list = get().products;
    if (list.length) return list;
    return PRODUCT_KEYS.map((key) => ({
      key,
      label: PRODUCT_LABELS[key],
      initialStock: 0,
    }));
  },

  getInitialStock: (key) => {
    const p = get().products.find((x) => x.key === key);
    return p ? p.initialStock : 0;
  },

  hasProduct: (key) => get().getProductKeys().includes(key),

  // async actions against the backend
  loadProducts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/api/products");
      set({ products: res.data, loading: false });
    } catch (err) {
      console.error(err);
      set({ error: err, loading: false });
    }
  },

  updateInitialStock: async (key, quantity) => {
    if (!key || typeof quantity !== "number" || quantity < 0) {
      return false;
    }
    try {
      const res = await axios.put(`/api/products/${encodeURIComponent(key)}`, {
        initialStock: quantity,
      });
      set((state) => ({
        products: state.products.map((p) => (p.key === key ? res.data : p)),
      }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  addProduct: async (product) => {
    try {
      const res = await axios.post("/api/products", product);
      set((state) => ({ products: [...state.products, res.data] }));
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
}));

// kick off a fetch when the module is imported so that stores are populated
useProductStore.getState().loadProducts();
