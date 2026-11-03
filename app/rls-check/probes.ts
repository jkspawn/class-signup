import "server-only";
import { getAuthClient } from "@/lib/supabase-server";

// 권한 테스트용 요청: 모두 지금 로그인한 사용자의 세션(publishable 키 + 사용자 토큰)으로 보낸다.
// 서버 키는 쓰지 않으므로 RLS가 그대로 적용된다. 응답에서 상태·오류·데이터·건수만 골라 담고,
// 토큰이나 요청 헤더는 담지도 출력하지도 않는다.

export type ProbeResult = {
  key: string;
  at: string;
  label: string;
  request: string;
  status: number;
  statusText: string;
  rows: number; // 응답에 담겨 온 행 수
  changed: number; // DB에서 실제로 바뀐(삭제된) 행 수
  error: { code: string; message: string; details: string | null; hint: string | null } | null;
  data: unknown;
};

type RawResponse = {
  status: number;
  statusText: string;
  data: unknown;
  count?: number | null;
  error: { code: string; message: string; details: string | null; hint: string | null } | null;
};

const COLUMNS = "id, class_id, user_id, name, created_at";

function toResult(label: string, request: string, r: RawResponse, changed: number): ProbeResult {
  return {
    key: crypto.randomUUID(),
    at: new Date().toISOString(),
    label,
    request,
    status: r.status,
    statusText: r.statusText,
    rows: Array.isArray(r.data) ? r.data.length : 0,
    changed,
    error: r.error
      ? { code: r.error.code, message: r.error.message, details: r.error.details, hint: r.error.hint }
      : null,
    data: r.data,
  };
}

export async function selectMine() {
  const r = await (await getAuthClient()).from("signups").select(COLUMNS).order("created_at");
  return toResult("내 신청 목록", `GET signups?select=${COLUMNS} (조건 없음)`, r, 0);
}

export async function selectById(id: string) {
  const r = await (await getAuthClient()).from("signups").select(COLUMNS).eq("id", id);
  return toResult("ID로 조회", `GET signups?select=${COLUMNS}&id=eq.${id}`, r, 0);
}

export async function deleteById(id: string) {
  const r = await (await getAuthClient())
    .from("signups")
    .delete({ count: "exact" })
    .eq("id", id)
    .select(COLUMNS);
  return toResult("ID로 취소(삭제)", `DELETE signups?id=eq.${id}`, r, r.count ?? 0);
}
