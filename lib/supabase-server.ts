import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버에서만 쓰는 Supabase 클라이언트.
// 키는 환경변수(.env.local / Vercel)에서만 읽고 NEXT_PUBLIC_ 접두사를 쓰지 않으므로 브라우저로 가지 않는다.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다. .env.example을 참고해 .env.local을 만드세요.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getAuthEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 환경변수가 없습니다. .env.example을 참고해 .env.local을 만드세요.",
    );
  }
  return { url, key };
}

// 로그인한 사용자 권한의 클라이언트. 세션은 쿠키에 두고, RLS가 적용된다
// (자기 신청 조회·취소용). 정원 계산과 신청 저장은 getSupabase로 한다.
export async function getAuthClient() {
  const { url, key } = getAuthEnv();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts가 맡는다.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const { data } = await (await getAuthClient()).auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}
