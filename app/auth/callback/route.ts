import { NextResponse, type NextRequest } from "next/server";
import { getAuthClient } from "@/lib/supabase-server";

// 가입 확인 메일의 링크가 돌아오는 곳: code를 세션으로 바꾸고 신청 화면으로 보낸다
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const { error } = await (await getAuthClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
    console.error("exchangeCodeForSession failed:", error);
  }
  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}
