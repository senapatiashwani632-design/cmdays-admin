import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Commitee from "@/app/models/Commitee";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { updates } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Invalid updates data" },
        { status: 400 },
      );
    }

    // Update each committee member's order
    const updatePromises = updates.map(
      (update: { id: string; order: number }) =>
        Commitee.findByIdAndUpdate(
          update.id,
          { order: update.order },
          { returnDocument: "after" },
        ),
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating committee order:", error);
    return NextResponse.json(
      { error: "Failed to update committee order" },
      { status: 500 },
    );
  }
}