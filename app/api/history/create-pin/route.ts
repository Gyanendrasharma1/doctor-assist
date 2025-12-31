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

    // 3️⃣ Validate PIN (exactly 4 digits)
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    // 4️⃣ Check if PIN already exists
    const { data: doctor, error: fetchError } = await supabase
      .from("doctors")
      .select("history_pin_hash")
      .eq("id", doctorId)
      .single();

    if (fetchError || !doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    if (doctor.history_pin_hash) {
      return NextResponse.json(
        { error: "PIN already exists" },
        { status: 400 }
      );
    }

    // 5️⃣ Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // 6️⃣ Save hashed PIN
    const { error: updateError } = await supabase
      .from("doctors")
      .update({ history_pin_hash: hashedPin })
      .eq("id", doctorId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save PIN" },
        { status: 500 }
      );
    }

    // 7️⃣ Success
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("CREATE PIN ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
