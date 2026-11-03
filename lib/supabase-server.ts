import "server-only";
import { createClient } from "@supabase/supabase-js";

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
