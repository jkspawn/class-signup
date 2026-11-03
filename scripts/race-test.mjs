// 동시성 테스트: 정원 N짜리 임시 클래스에 M건을 동시에 신청 → 성공이 정확히 N건인지 확인 후 정리.
// 실행: node --env-file=.env.local scripts/race-test.mjs
import { createClient } from "@supabase/supabase-js";

const CAPACITY = 3;
const ATTEMPTS = 20;

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: cls, error } = await db
  .from("classes")
  .insert({ title: "[race-test]", starts_at: new Date().toISOString(), capacity: CAPACITY })
  .select("id")
  .single();
if (error) throw error;

try {
  const results = await Promise.all(
    Array.from({ length: ATTEMPTS }, (_, i) =>
      db.rpc("apply_to_class", { p_class_id: cls.id, p_name: `tester${i}` }),
    ),
  );
  const ok = results.filter((r) => r.data?.ok).length;
  const full = results.filter((r) => r.data?.reason === "full").length;
  const errors = results.filter((r) => r.error).map((r) => r.error.message);

  const { count } = await db
    .from("signups")
    .select("id", { count: "exact", head: true })
    .eq("class_id", cls.id);

  console.log({ capacity: CAPACITY, attempts: ATTEMPTS, ok, full, stored: count, errors });
  const pass = ok === CAPACITY && count === CAPACITY && errors.length === 0;
  console.log(pass ? "PASS: 정원을 넘기지 않았습니다." : "FAIL");
  process.exitCode = pass ? 0 : 1;
} finally {
  await db.from("classes").delete().eq("id", cls.id); // signups는 cascade로 함께 삭제
}
