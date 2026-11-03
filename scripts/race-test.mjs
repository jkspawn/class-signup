// 동시성 테스트: 정원 N짜리 임시 클래스에 서로 다른 계정 M개가 동시에 신청 → 성공이 정확히 N건인지,
// 그리고 한 계정이 동시에 여러 번 눌러도 1건만 들어가는지 확인 후 정리.
// 실행: node --env-file=.env.local scripts/race-test.mjs
import { createClient } from "@supabase/supabase-js";
import { createTestUsers, deleteTestUsers } from "./test-users.mjs";

const CAPACITY = 3;
const ATTEMPTS = 20;
const DOUBLE_CLICKS = 5;

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

let users = [];
try {
  users = await createTestUsers(db, ATTEMPTS, "race");
  const results = await Promise.all(
    users.map((u, i) =>
      db.rpc("apply_to_class", { p_class_id: cls.id, p_user_id: u.id, p_name: `tester${i}` }),
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

  // 같은 계정이 한꺼번에 여러 번 신청: 정원이 남은 새 클래스에서 1건만 성공해야 한다
  const { data: cls2, error: e2 } = await db
    .from("classes")
    .insert({ title: "[race-test-dup]", starts_at: new Date().toISOString(), capacity: CAPACITY })
    .select("id")
    .single();
  if (e2) throw e2;
  let dupOk, dupStored;
  try {
    const dup = await Promise.all(
      Array.from({ length: DOUBLE_CLICKS }, () =>
        db.rpc("apply_to_class", { p_class_id: cls2.id, p_user_id: users[0].id, p_name: "dup" }),
      ),
    );
    dupOk = dup.filter((r) => r.data?.ok).length;
    ({ count: dupStored } = await db
      .from("signups")
      .select("id", { count: "exact", head: true })
      .eq("class_id", cls2.id));
    console.log({ sameUserClicks: DOUBLE_CLICKS, ok: dupOk, stored: dupStored });
  } finally {
    await db.from("classes").delete().eq("id", cls2.id);
  }

  const pass =
    ok === CAPACITY && count === CAPACITY && errors.length === 0 && dupOk === 1 && dupStored === 1;
  console.log(pass ? "PASS: 정원을 넘기지 않았습니다." : "FAIL");
  process.exitCode = pass ? 0 : 1;
} finally {
  await db.from("classes").delete().eq("id", cls.id); // signups는 cascade로 함께 삭제
  await deleteTestUsers(db, users);
}
