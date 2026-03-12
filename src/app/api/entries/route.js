import dbConnection from "@/lib/mongodb";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

const PRODUCT_KEYS = [
  "tamboresPcb",
  "tamboresPesticida",
  "tamboresPcbVigentes",
  "tamboresPcbDaniados",
  "tamboresPcbVencidos",
  "tamboresPesticidaVigentes",
  "tamboresPesticidaDaniados",
  "tamboresPesticidaVencidos",
  "bolsonesPcb",
  "bolsonesPesticida",
  "bolsonesPcbVigentes",
  "bolsonesPcbVencidos",
  "bolsonesPesticidaVigentes",
  "bolsonesPesticidaVencidos",
  "palletsBigBag",
  "palletsTambores",
  "tirantes",
  "tablas",
  "bines",
  "absorbente",
];

export async function GET() {
  await dbConnection();
  try {
    const entries = await Entry.find().sort({ year: -1, month: -1 }).lean();
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error al obtener entries:", error);
    return NextResponse.json(
      { error: "Error al obtener los registros", detail: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  await dbConnection();
  try {
    const body = await request.json();
    const { month, year, operatorStock } = body;

    // Validaciones con mensajes claros
    if (month === undefined || month === null)
      return NextResponse.json(
        { error: "El campo 'month' es requerido" },
        { status: 400 },
      );

    if (year === undefined || year === null)
      return NextResponse.json(
        { error: "El campo 'year' es requerido" },
        { status: 400 },
      );

    const monthNum = Number(month);
    const yearNum = Number(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12)
      return NextResponse.json(
        { error: "El mes debe ser un número entre 1 y 12" },
        { status: 400 },
      );

    if (isNaN(yearNum) || yearNum < 2020)
      return NextResponse.json(
        { error: "El año debe ser un número válido (>= 2020)" },
        { status: 400 },
      );

    // Verificar duplicado antes de intentar guardar
    const existing = await Entry.findOne({ month: monthNum, year: yearNum });
    if (existing) {
      return NextResponse.json(
        {
          error: `Ya existe un registro para ${monthNum}/${yearNum}`,
          existingId: existing._id,
        },
        { status: 409 },
      );
    }

    // Normalizar operatorStock con todos los keys
    const stock = operatorStock || {};
    const normalizedStock = {};
    for (const key of PRODUCT_KEYS) {
      normalizedStock[key] = Number(stock[key]) || 0;
    }

    // finalStock = operatorStock (sin ajuste admin aún)
    // Los subcampos se copian tal cual desde operatorStock
    const finalStock = { ...normalizedStock };

    const newEntry = new Entry({
      month: monthNum,
      year: yearNum,
      operatorStock: normalizedStock,
      finalStock,
      operatorSubmittedAt: new Date(),
    });

    const saved = await newEntry.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    // Duplicate key de MongoDB (por si la verificación anterior tuvo race condition)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Ya existe un registro para ese mes/año" },
        { status: 409 },
      );
    }
    // Error de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: "Error de validación", detail: messages.join(", ") },
        { status: 400 },
      );
    }
    // Cualquier otro error — loguear el mensaje real
    console.error("Error al crear entry:", error.message, error.stack);
    return NextResponse.json(
      { error: "Error al crear la entrada", detail: error.message },
      { status: 500 },
    );
  }
}
