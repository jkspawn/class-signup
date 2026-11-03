@AGENTS.md

# 원데이 클래스 신청 페이지

정원이 정해진 원데이 클래스 신청 페이지. 요구사항은 `PRD.md`.

## 스택 (모두 무료 플랜)
- **Next.js 16** (App Router, TypeScript, Tailwind) — 페이지 + Server Action
- **Supabase** (Postgres) — 데이터 저장, 정원 보장
- **Vercel** — 배포

## 로컬 실행
1. `npm install`
2. supabase.com에서 무료 프로젝트 생성 → SQL Editor에서 `supabase/schema.sql` 실행 (테이블·함수·샘플 클래스)
3. `.env.example`을 `.env.local`로 복사하고 값 입력
   - `SUPABASE_URL=https://<ref>.supabase.co` — 뒤에 `/rest/v1/` 붙이지 않기
   - `SUPABASE_SERVICE_ROLE_KEY=` service_role 또는 secret(`sb_secret_...`) 키
   - `SUPABASE_PUBLISHABLE_KEY=` publishable(`sb_publishable_...`) 또는 anon 키 — 로그인용
4. `npm run dev` → http://localhost:3000

## 확인 명령
- `npx tsc --noEmit` / `npm run lint` / `npm run build`
- 동시성: `node --env-file=.env.local scripts/race-test.mjs` → `PASS`여야 함 (임시 클래스·테스트 계정 만들고 끝나면 삭제)
- 권한(RLS): `node --env-file=.env.local scripts/rls-test.mjs` → `PASS`여야 함

## 구조
- `supabase/schema.sql` — `classes`, `signups`(+`user_id`) 테이블, `apply_to_class()` 함수, RLS 정책. 다시 실행해도 안전
- `lib/supabase-server.ts` — 서버 전용 DB 클라이언트 + 쿠키 세션 인증 클라이언트 (`server-only`)
- `proxy.ts` — 세션 쿠키 갱신, 비로그인 `/` → `/login` (Next 16에서 middleware 대신 proxy)
- `app/login/` — 이메일·비밀번호 로그인/회원가입 화면과 액션, 로그아웃 액션
- `app/auth/callback/route.ts` — 가입 확인 메일 링크 처리
- `app/rls-check/` — 일반 사용자 권한 테스트 화면. 로그인 세션으로만 조회·취소 요청을 보낸다 (서버 키 금지, 토큰 출력 금지)
- `app/page.tsx` — 클래스 정보·남은 자리·마감 표시 (서버 컴포넌트)
- `app/SignupForm.tsx` — 이름 입력·신청 버튼 (클라이언트 컴포넌트)
- `app/actions.ts` — 신청 Server Action

## 지켜야 할 규칙
### 범위
- 로그인은 Supabase 이메일·비밀번호 인증만 쓴다. 결제·후기는 만들지 않는다.
- 유료 서비스나 유료 플랜이 필요한 기능을 들이지 않는다.

### 비밀값
- 키는 `.env.local`(git 제외)과 Vercel 환경변수에만 둔다. 코드·커밋·로그에 값을 쓰지 않는다.
- DB 키에 `NEXT_PUBLIC_` 접두사 금지 (브라우저 번들에 들어감).
- DB 접근은 서버 코드에서만, `lib/supabase-server.ts`를 통해서만. 클라이언트 컴포넌트에서 Supabase를 import하지 않는다.
- 새 테이블도 RLS를 켜고, 새 DB 함수는 `anon`/`authenticated`에서 execute를 revoke한다.
- `signups`는 RLS로 본인 행만 조회·삭제한다. 내 신청 조회·취소는 `getAuthClient()`(사용자 권한)로, 정원 계산과 신청 저장은 `getSupabase()`(서버 키)로 한다. `signups`에 insert/update 정책을 만들지 않는다.

### 정원 (가장 중요)
- 신청은 **반드시 `apply_to_class(class_id, user_id, name)` RPC로만** 한다. `user_id`는 서버에서 `getCurrentUser()`로 확인한 값만 넘긴다. 한 계정은 한 클래스에 한 번만 신청한다. 앱 코드에서 "인원 조회 → insert"를 나눠 하지 않는다 (동시 요청 시 정원 초과).
- 남은 자리는 `capacity - count(signups)`로 계산한다. 별도 카운터 컬럼을 만들지 않는다.
- 신청 로직이나 스키마를 바꾸면 race-test·rls-test를 다시 돌려 `PASS`를 확인한다.

### Next.js 16 주의
- `cacheComponents`가 켜져 있다. 요청마다 바뀌는 데이터는 `<Suspense>` 안에서 `await connection()` 후 읽는다.
- 신청 후 화면 갱신은 Server Action에서 `refresh()` (`next/cache`).
- API가 기억과 다를 수 있으니 `node_modules/next/dist/docs/`를 먼저 확인한다.
