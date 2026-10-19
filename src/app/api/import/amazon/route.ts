import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { parseAmazonOrderReport } from "@/lib/amazon";
import { importAmazonOrders } from "@/lib/amazon-import";

const MAX_REPORT_BYTES = 5 * 1024 * 1024;

// Recibe el CSV del reporte de pedidos de Amazon en el body (text/csv o text/plain).
export async function POST(request: NextRequest) {
  const csv = await request.text();

  if (!csv.trim()) {
    return NextResponse.json(
      { error: "Se requiere el CSV del reporte de pedidos de Amazon" },
      { status: 400 }
    );
  }

  if (Buffer.byteLength(csv) > MAX_REPORT_BYTES) {
    return NextResponse.json(
      { error: "El reporte supera 5 MB. Divídelo por rango de fechas" },
      { status: 413 }
    );
  }

  const parsed = parseAmazonOrderReport(csv);
  if (parsed.orders.length === 0 && parsed.skipped.length === 0) {
    return NextResponse.json(
      { error: "El CSV no contiene pedidos. Revisa que sea el reporte de pedidos de Amazon" },
      { status: 400 }
    );
  }

  try {
    const imported = importAmazonOrders(db, parsed.orders);
    return NextResponse.json({ ...imported, skipped: parsed.skipped }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error importando pedidos" },
      { status: 500 }
    );
  }
}
