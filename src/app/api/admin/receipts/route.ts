import { NextResponse } from "next/server";
import { submitPaymentReceipt } from "@/actions/payment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await submitPaymentReceipt(formData);

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to submit receipt";
    console.error("[POST /api/admin/receipts]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
