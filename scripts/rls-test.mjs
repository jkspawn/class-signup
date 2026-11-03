// RLS 테스트: 두 계정 A·B가 같은 임시 클래스에 신청한 뒤, A의 로그인 세션으로
// 자기 신청만 보이는지 / B의 신청은 못 지우는지 / 직접 insert·함수 호출이 막히는지 / 자기 신청은 취소되는지 확인.
// 실행: node --env-file=.env.local scripts/rls-test.mjs
import { createClient } from "@supabase/supabase-js";
import { createTestUsers, deleteTestUsers } from "./test-users.mjs";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: cls, error } = await db
  .from("classes")
  .insert({ title: "[rls-test]", starts_at: new Date().toISOString(), capacity: 5 })
  .select("id")
  .single();
if (error) throw error;

let users = [];
const checks = [];
const check = (label, pass, detail) => {
  checks.push(pass);
  console.log(`${pass ? "ok  " : "FAIL"} ${label}`, detail ?? "");
};

try {
  users = await createTestUsers(db, 2, "rls");
  const [a, b] = users;
  for (const [u, name] of [[a, "A"], [b, "B"]]) {
    const { data, error } = await db.rpc("apply_to_class", { p_class_id: cls.id, p_user_id: u.id, p_name: name });
    if (error || !data.ok) throw error ?? new Error(JSON.stringify(data));
  }
  const { data: rows } = await db.from("signups").select("id, user_id").eq("class_id", cls.id);
  const bRow = rows.find((r) => r.user_id === b.id);

  // A로 로그인한 클라이언트 (앱의 getAuthClient와 같은 권한)
  const asA = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInErr } = await asA.auth.signInWithPassword({ email: a.email, password: a.password });
  if (signInErr) throw signInErr;

  const seen = await asA.from("signups").select("id, user_id").eq("class_id", cls.id);
  check("A는 자기 신청 1건만 본다", !seen.error && seen.data.length === 1 && seen.data[0].user_id === a.id, seen.error?.message);

  const delB = await asA.from("signups").delete().eq("id", bRow.id).select("id");
  const { count: bStill } = await db.from("signups").select("id", { count: "exact", head: true }).eq("id", bRow.id);
  check("A는 B의 신청을 지우지 못한다", (delB.data?.length ?? 0) === 0 && bStill === 1, delB.error?.message);

  const ins = await asA.from("signups").insert({ class_id: cls.id, user_id: a.id, name: "직접" });
  check("A는 신청을 직접 insert하지 못한다 (함수로만)", !!ins.error, ins.error?.message);

  const rpc = await asA.rpc("apply_to_class", { p_class_id: cls.id, p_user_id: b.id, p_name: "사칭" });
  check("A는 신청 함수를 직접 부르지 못한다", !!rpc.error, rpc.error?.message);

  const upd = await asA.from("signups").update({ name: "변경" }).eq("id", bRow.id).select("id");
  check("A는 B의 신청을 고치지 못한다", (upd.data?.length ?? 0) === 0, upd.error?.message);

  const delA = await asA.from("signups").delete().eq("id", seen.data[0].id).select("id");
  check("A는 자기 신청을 취소할 수 있다", delA.data?.length === 1, delA.error?.message);

  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
  const anonSeen = await anon.from("signups").select("id").eq("class_id", cls.id);
  check("로그인 안 한 사용자는 아무 신청도 못 본다", (anonSeen.data?.length ?? 0) === 0, anonSeen.error?.message);

  const pass = checks.every(Boolean);
  console.log(pass ? "PASS: 다른 사람 신청은 건드릴 수 없습니다." : "FAIL");
  process.exitCode = pass ? 0 : 1;
} finally {
  await db.from("classes").delete().eq("id", cls.id);
  await deleteTestUsers(db, users);
}
