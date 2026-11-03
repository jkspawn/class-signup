// 마지막 한 자리 테스트: 정원 10 중 9자리가 찬 임시 클래스에 서로 다른 계정 20개가 동시에 신청한다.
// 기대 결과: 딱 1건만 성공, 최종 인원 10 (정원 초과 없음). 끝나면 임시 클래스를 삭제한다.
// 실행: node --env-file=.env.local scripts/last-seat-test.mjs
import { createClient } from "@supabase/supabase-js";
import { createTestUsers, deleteTestUsers } from "./test-users.mjs";

const CAPACITY = 10;
const PREFILLED = 9;
const ATTEMPTS = 20;

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const t0 = performance.now();
const ms = () => `${(performance.now() - t0).toFixed(0).padStart(5)}ms`;
const log = (...a) => console.log(ms(), ...a);

// 1) 준비: 임시 클래스 + 미리 찬 9자리
const { data: cls, error } = await db
  .from("classes")
  .insert({ title: "[last-seat-test]", starts_at: new Date().toISOString(), capacity: CAPACITY })
  .select("id")
  .single();
if (error) throw error;

let users = [];
try {
  users = await createTestUsers(db, ATTEMPTS, "last-seat");
  // 미리 찬 자리는 계정 없이 넣는다 (로그인 기능 전 신청과 같은 모양, 정원에는 포함)
  const { error: preErr } = await db.from("signups").insert(
    Array.from({ length: PREFILLED }, (_, i) => ({ class_id: cls.id, name: `기존${i + 1}` })),
  );
  if (preErr) throw preErr;
  log(`준비 완료: 정원 ${CAPACITY}, 현재 ${PREFILLED}명 → 남은 자리 ${CAPACITY - PREFILLED}`);
  log(`동시 신청 ${ATTEMPTS}건 발사`);

  // 2) 동시에 보내기
  const results = await Promise.all(
    users.map(async (u, i) => {
      const name = `동시${String(i + 1).padStart(2, "0")}`;
      const { data, error } = await db.rpc("apply_to_class", {
        p_class_id: cls.id,
        p_user_id: u.id,
        p_name: name,
      });
      const outcome = error ? `오류(${error.message})` : data.ok ? "성공" : data.reason === "full" ? "마감" : data.reason;
      log(`  ${name} → ${outcome}`);
      return { name, outcome };
    }),
  );

  // 3) 결과 확인
  const { count } = await db
    .from("signups")
    .select("id", { count: "exact", head: true })
    .eq("class_id", cls.id);
  const winners = results.filter((r) => r.outcome === "성공");
  const full = results.filter((r) => r.outcome === "마감").length;
  const errors = results.length - winners.length - full;

  console.log("");
  log(`성공 ${winners.length}건 (${winners.map((w) => w.name).join(", ") || "없음"}), 마감 ${full}건, 오류 ${errors}건`);
  log(`DB 최종 인원 ${count} / 정원 ${CAPACITY}`);

  const pass = winners.length === 1 && count === CAPACITY && errors === 0;
  log(pass ? "PASS: 마지막 자리는 딱 1명, 정원 초과 없음" : "FAIL");
  process.exitCode = pass ? 0 : 1;
} finally {
  await db.from("classes").delete().eq("id", cls.id); // signups는 cascade로 함께 삭제
  await deleteTestUsers(db, users);
  log("임시 클래스·테스트 계정 삭제 완료");
}
