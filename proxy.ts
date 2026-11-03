import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 요청마다 Supabase 세션 쿠키를 갱신하고, 로그인 여부에 따라 /login ↔ / 로 보낸다.
// 여기는 빠른 길 안내일 뿐이고, 진짜 확인은 page.tsx와 Server Action에서 다시 한다.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response; // 설정 오류는 페이지에서 알려 준다

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server Action(POST)은 보내지 않고 액션 안의 로그인 확인에 맡긴다
  if (request.method !== "GET") return response;

  const path = request.nextUrl.pathname;
  const target = !user && path === "/" ? "/login" : user && path === "/login" ? "/" : null;
  if (!target) return response;

  // 갱신된 세션 쿠키를 리다이렉트 응답에도 옮겨 담는다
  const redirect = NextResponse.redirect(new URL(target, request.url));
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  // 정적 파일·이미지·예시 화면(/demo)은 건너뛴다
  matcher: ["/((?!_next/static|_next/image|favicon.ico|demo|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
