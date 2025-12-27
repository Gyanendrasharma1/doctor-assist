import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert doctor using SERVICE ROLE client (bypass RLS)
    const { error } = await supabaseAdmin
      .from("doctors")
      .insert({
        email,
        password_hash,
      });

    if (error) {
      console.error("Signup error:", error);
      return NextResponse.json(
        { error: "Failed to create doctor" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected signup error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
