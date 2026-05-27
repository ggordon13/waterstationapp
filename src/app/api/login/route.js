import { NextResponse } from "next/server";

export async function POST(request) {
  const { username, password } = await request.json();

  if (username === "admin" && password === "password123") {
    const response = NextResponse.json({ success: true });

    response.cookies.set("auth-token", "secure-demo-token", {
      httpOnly: true,
      path: "/",
    });

    return response;
  }

  return NextResponse.json(
    { success: false },
    { status: 401 }
  );
}