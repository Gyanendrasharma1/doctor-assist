import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
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

    // 2️⃣ Read PIN from body
    const { pin } = await req.json();

    // 3️⃣ Validate PIN format
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { valid: false, error: "Invalid PIN format" },
        { status: 400 }
      );
    }

    // 4️⃣ Fetch stored PIN hash
    const { data: doctor, error } = await supabase
      .from("doctors")
      .select("history_pin_hash")
      .eq("id", doctorId)
      .single();

    if (error || !doctor || !doctor.history_pin_hash) {
      return NextResponse.json(
        { valid: false },
        { status: 400 }
      );
    }

    // 5️⃣ Compare PIN
    const isValid = await bcrypt.compare(
      pin,
      doctor.history_pin_hash
    );

    // 6️⃣ Return result
    return NextResponse.json({ valid: isValid });

  } catch (err) {
    console.error("VERIFY PIN ERROR:", err);
    return NextResponse.json(
      { valid: false },
      { status: 500 }
    );
  }
}
