import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // check existing doctor
    const { data: existing } = await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Doctor already exists" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const { error } = await supabaseAdmin.from("doctors").insert({
      email,
      password_hash: hash,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to create doctor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Signup error" },
      { status: 500 }
    );
  }
}
