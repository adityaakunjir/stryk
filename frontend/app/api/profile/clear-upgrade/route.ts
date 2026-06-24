import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/players/clear-upgrade`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, message: "Failed to clear flag" }, { status: res.status });
  } catch (error) {
    console.error("Error clearing upgrade flag:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
