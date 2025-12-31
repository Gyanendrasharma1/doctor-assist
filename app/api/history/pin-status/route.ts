import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 1️⃣ Get logged-in session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const doctorId = session.user.id;

    // 2️⃣ Fetch doctor's PIN hash
    const { data, error } = await supabase
      .from("doctors")
      .select("history_pin_hash")
      .eq("id", doctorId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    // 3️⃣ Check if PIN exists
    const hasPin = Boolean(data?.history_pin_hash);

    return NextResponse.json({ hasPin });
  } catch (err) {
    console.error("PIN status error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
