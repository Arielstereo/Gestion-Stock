import dbConnection from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Entry from "@/models/Entry";
import mongoose from "mongoose";

const PRODUCT_KEYS = [
  "sobreTambores",
  "sobreTamboresVigentes",
  "sobreTamboresDaniados",
  "sobreTamboresVencidos",
  "tamboresPcb",
  "tamboresPesticidas",
  "tamboresPcbVigentes",
  "tamboresPcbDaniados",
  "tamboresPcbVencidos",
  "tamboresPesticidasVigentes",
  "tamboresPesticidasDaniados",
  "tamboresPesticidaVencidos",
  "bolsonesPcb",
  "bolsonesPesticidas",
  "bolsonesPcbVigentes",
  "bolsonesPcbVencidos",
  "bolsonesPesticidasVigentes",
  "bolsonesPesticidasVencidos",
  "absorbente",
  "bines",
  "palletsBigBag",
  "palletsTambores",
  "sobreTambores",
  "tablas",
  "tirantes",
];

const TAMBORES_SUB_KEYS = [
  "sobreTamboresVigentes",
  "sobreTamboresDaniados",
  "sobreTamboresVencidos",
  "tamboresPcbVigentes",
  "tamboresPcbDaniados",
  "tamboresPcbVencidos",
  "tamboresPesticidasVigentes",
  "tamboresPesticidasDaniados",
  "tamboresPesticidasVencidos",
];

const BOLSONES_SUB_KEYS = [
  "bolsonesPcbVigentes",
  "bolsonesPcbVencidos",
  "bolsonesPesticidasVigentes",
  "bolsonesPesticidasVencidos",
];

const calcFinalStock = (op = {}, adj = {}) => {
  const final = {};
  for (const key of PRODUCT_KEYS) {
    if (TAMBORES_SUB_KEYS.includes(key) || BOLSONES_SUB_KEYS.includes(key)) {
      final[key] = op[key] || 0;
    } else {
      final[key] = (op[key] || 0) + (adj[key] || 0);
    }
  }
  return final;
};

// GET /api/entries/[id]
export async function GET(request, { params }) {
  await dbConnection();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const entry = await Entry.findById(id).lean();
    if (!entry)
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el registro", detail: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/entries/[id]
export async function PUT(request, { params }) {
  await dbConnection();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const body = await request.json();
    const { operatorStock, adminAdjustment, adminNote } = body;

    const entry = await Entry.findById(id);
    if (!entry)
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );

    if (operatorStock !== undefined) {
      entry.operatorStock = {
        ...entry.operatorStock.toObject(),
        ...operatorStock,
      };
      entry.operatorSubmittedAt = new Date();
    }

    if (adminAdjustment !== undefined) {
      const prevAdj = entry.adminAdjustment.toObject();
      const accumulated = {};
      for (const key of PRODUCT_KEYS) {
        accumulated[key] = (prevAdj[key] || 0) + (adminAdjustment[key] || 0);
      }
      entry.adminAdjustment = accumulated;
      entry.adminSubmittedAt = new Date();
    }

    if (adminNote !== undefined && adminNote.trim() !== "") {
      const prevNote = entry.adminNote || "";
      const timestamp = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      });
      entry.adminNote = prevNote
        ? `${prevNote}\n--- ${timestamp} ---\n${adminNote}`
        : `--- ${timestamp} ---\n${adminNote}`;
    }

    // Calcular y validar que no quede nada negativo
    const newFinal = calcFinalStock(
      entry.operatorStock.toObject(),
      entry.adminAdjustment.toObject(),
    );

    const negatives = Object.entries(newFinal)
      .filter(([, v]) => v < 0)
      .map(([k]) => k);
    if (negatives.length > 0) {
      return NextResponse.json(
        { error: "El stock final no puede ser negativo", fields: negatives },
        { status: 422 },
      );
    }

    entry.finalStock = newFinal;
    const saved = await entry.save();
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Error al actualizar entry:", error);
    return NextResponse.json(
      { error: "Error al actualizar el registro", detail: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/entries/[id]
export async function DELETE(request, { params }) {
  await dbConnection();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const deleted = await Entry.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el registro", detail: error.message },
      { status: 500 },
    );
  }
}
