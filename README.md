# 원데이 클래스 신청

Next.js(App Router) + Supabase(Postgres). 정원은 DB 함수 `apply_to_class`가 행 잠금(`SELECT … FOR UPDATE`)으로 지킵니다.

## 설정
1. [supabase.com](https://supabase.com)에서 무료 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다(테이블·함수·샘플 클래스 생성).
3. `.env.example`을 `.env.local`로 복사하고 Project Settings > API Keys의 URL과 service_role(또는 secret) 키를 넣습니다.
4. `npm install` → `npm run dev` → http://localhost:3000

## 테스트
- 동시성: `node --env-file=.env.local scripts/race-test.mjs` (정원 3짜리 임시 클래스에 20건 동시 신청 → 성공 3건이면 PASS, 끝나면 삭제)

## 배포 (Vercel 무료)
GitHub에 올린 뒤 Vercel에서 가져오고, Environment Variables에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 등록합니다.
키에 `NEXT_PUBLIC_`을 붙이지 마세요.

클래스 정보 변경·추가는 Supabase 대시보드의 `classes` 테이블에서 합니다(페이지는 가장 먼저 만든 클래스 1개를 보여줍니다).
