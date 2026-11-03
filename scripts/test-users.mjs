// 테스트용 임시 계정: 신청이 계정별로 1건이라 동시성 테스트에는 계정이 여러 개 필요하다.
// 메일 확인을 건너뛴(email_confirm) 계정을 만들고, 끝나면 지운다 (그 계정의 신청도 cascade로 삭제).
import { randomBytes } from "node:crypto";

export async function createTestUsers(db, count, label) {
  const tag = randomBytes(4).toString("hex");
  const users = [];
  try {
    for (let i = 0; i < count; i++) {
      const email = `${label}-${tag}-${i}@example.test`;
      const password = randomBytes(18).toString("base64url");
      const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      users.push({ id: data.user.id, email, password });
    }
  } catch (e) {
    await deleteTestUsers(db, users);
    throw e;
  }
  return users;
}

export async function deleteTestUsers(db, users) {
  for (const u of users) {
    const { error } = await db.auth.admin.deleteUser(u.id);
    if (error) console.error(`테스트 계정 삭제 실패 (${u.email}):`, error.message);
  }
}
