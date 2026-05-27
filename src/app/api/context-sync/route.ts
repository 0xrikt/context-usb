import { NextResponse } from "next/server";
import { isValidToken } from "@/lib/sync/token";
import { saveContext, deleteContext } from "@/lib/sync/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, contextFiles } = body;

    if (!token || !isValidToken(token)) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    if (!Array.isArray(contextFiles)) {
      return NextResponse.json(
        { error: "contextFiles must be an array" },
        { status: 400 }
      );
    }

    await saveContext(token, contextFiles);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Context sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || !isValidToken(token)) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    await deleteContext(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Context delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
