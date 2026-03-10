import mongoose from "mongoose";

const ProductSnapshotSchema = new mongoose.Schema(
  {
    tambores: { type: Number, default: 0 },
    palletsLivianos: { type: Number, default: 0 },
    palletsPesados: { type: Number, default: 0 },
    tirantes: { type: Number, default: 0 },
    bigBag: { type: Number, default: 0 },
    absorventes: { type: Number, default: 0 },
    bines: { type: Number, default: 0 },
  },
  { _id: false },
);

const EntrySchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: [true, "El mes es requerido"],
      min: [1, "Mes inválido"],
      max: [12, "Mes inválido"],
    },
    year: {
      type: Number,
      required: [true, "El año es requerido"],
      min: [2020, "Año inválido"],
    },

    // Conteo físico del operario
    operatorStock: {
      type: ProductSnapshotSchema,
      default: () => ({}),
    },
    operatorSubmittedAt: { type: Date, default: null },

    // Ajuste del administrador (suma o resta sobre el conteo del operario)
    adminAdjustment: {
      type: ProductSnapshotSchema,
      default: () => ({}),
    },
    adminNote: { type: String, default: "" },
    adminSubmittedAt: { type: Date, default: null },

    // Stock final = operatorStock + adminAdjustment (calculado al guardar)
    finalStock: {
      type: ProductSnapshotSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  },
);

// Índice único: solo un registro por mes/año
EntrySchema.index({ month: 1, year: 1 }, { unique: true });

// Evitar re-compilar el modelo en hot-reload de Next.js
const Entry = mongoose.models.Entry || mongoose.model("Entry", EntrySchema);

export default Entry;
