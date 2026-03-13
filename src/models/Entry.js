import mongoose from "mongoose";

const ProductSnapshotSchema = new mongoose.Schema(
  {
    // Totales por tipo de tambor
    tamboresPcb: { type: Number, default: 0 },
    tamboresPesticidas: { type: Number, default: 0 },
    // Detalle tambores PCB
    tamboresPcbVigentes: { type: Number, default: 0 },
    tamboresPcbDaniados: { type: Number, default: 0 },
    tamboresPcbVencidos: { type: Number, default: 0 },
    // Detalle tambores Pesticidas
    tamboresPesticidasVigentes: { type: Number, default: 0 },
    tamboresPesticidasDaniados: { type: Number, default: 0 },
    tamboresPesticidasVencidos: { type: Number, default: 0 },
    // Resto de productos
    palletsBigBag: { type: Number, default: 0 },
    palletsTambores: { type: Number, default: 0 },
    tirantes: { type: Number, default: 0 },
    tablas: { type: Number, default: 0 },
    sobreTambores: { type: Number, default: 0 },
    sobreTamboresVigentes: { type: Number, default: 0 },
    sobreTamboresDaniados: { type: Number, default: 0 },
    sobreTamboresVencidos: { type: Number, default: 0 },
    bines: { type: Number, default: 0 },
    absorbente: { type: Number, default: 0 },
    bolsonesPcb: { type: Number, default: 0 },
    bolsonesPcbVigentes: { type: Number, default: 0 },
    bolsonesPcbVencidos: { type: Number, default: 0 },
    bolsonesPesticidas: { type: Number, default: 0 },
    bolsonesPesticidasVigentes: { type: Number, default: 0 },
    bolsonesPesticidasVencidos: { type: Number, default: 0 },
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

// Subcampos que se copian del operario sin ajuste admin
const SUB_KEYS = [
  "sobreTamboresVigentes",
  "sobreTamboresDaniados",
  "sobreTamboresVencidos",
  "tamboresPcbVigentes",
  "tamboresPcbDaniados",
  "tamboresPcbVencidos",
  "tamboresPesticidasVigentes",
  "tamboresPesticidasDaniados",
  "tamboresPesticidasVencidos",
  "bolsonesPcbVigentes",
  "bolsonesPcbVencidos",
  "bolsonesPesticidasVigentes",
  "bolsonesPesticidasVencidos",
];

// finalStock solo cuenta vigentes para tambores y bolsones
// Los demás productos suman operatorStock + adminAdjustment normalmente
const VIGENTES_MAP = {
  sobreTambores: "sobreTamboresVigentes",
  tamboresPcb: "tamboresPcbVigentes",
  tamboresPesticidas: "tamboresPesticidasVigentes",
  bolsonesPcb: "bolsonesPcbVigentes",
  bolsonesPesticidas: "bolsonesPesticidasVigentes",
};

const ALL_KEYS = [
  "tamboresPcb",
  "tamboresPesticidas",
  "bolsonesPcb",
  "bolsonesPesticidas",
  "palletsBigBag",
  "palletsTambores",
  "sobreTambores",
  "absorbente",
  "bines",
  "tablas",
  "tirantes",
  ...SUB_KEYS,
];

// Middleware: recalcular finalStock antes de guardar
EntrySchema.pre("save", async function () {
  const op = this.operatorStock?.toObject?.() ?? this.operatorStock ?? {};
  const adj = this.adminAdjustment?.toObject?.() ?? this.adminAdjustment ?? {};

  const final = {};
  for (const key of ALL_KEYS) {
    if (SUB_KEYS.includes(key)) {
      // Subcampos: copiar directo del operario
      final[key] = op[key] || 0;
    } else if (VIGENTES_MAP[key]) {
      // Tambores/bolsones: finalStock = solo vigentes + ajuste admin
      final[key] = (op[VIGENTES_MAP[key]] || 0) + (adj[key] || 0);
    } else {
      // Resto: operatorStock + adminAdjustment
      final[key] = (op[key] || 0) + (adj[key] || 0);
    }
  }
  this.finalStock = final;
});

// Evitar re-compilar el modelo en hot-reload de Next.js
// Forzar recompilación en dev para que los cambios al schema/hooks se apliquen
if (mongoose.models.Entry) delete mongoose.models.Entry;
const Entry = mongoose.model("Entry", EntrySchema);

export default Entry;
