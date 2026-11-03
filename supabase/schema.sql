-- 원데이 클래스 신청: Supabase SQL Editor에서 실행하세요.
-- 여러 번 실행해도 안전합니다 (이미 있는 테이블·데이터는 그대로 두고 바뀐 부분만 적용).

create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  starts_at   timestamptz not null,
  capacity    int  not null check (capacity > 0),
  created_at  timestamptz not null default now()
);

create table if not exists signups (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 30),
  created_at  timestamptz not null default now()
);
create index if not exists signups_class_id_idx on signups(class_id);

-- 신청자 계정 연결. 로그인 기능 전에 들어온 신청은 user_id가 비어 있다(정원에는 포함).
alter table signups
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
-- 한 계정은 한 클래스에 한 번만
create unique index if not exists signups_class_user_key on signups(class_id, user_id);

-- RLS: classes는 정책 없음 → 서버 키로만 접근.
-- signups는 로그인한 사용자가 자기 행만 조회·삭제(취소)할 수 있다.
-- insert/update 정책은 없다 → 신청은 서버 키로 부르는 apply_to_class()로만 들어간다.
alter table classes enable row level security;
alter table signups enable row level security;

drop policy if exists "signups: 본인 조회" on signups;
create policy "signups: 본인 조회" on signups
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "signups: 본인 취소" on signups;
create policy "signups: 본인 취소" on signups
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 예전 버전(이름만 받던 함수) 제거
drop function if exists apply_to_class(uuid, text);

-- 정원 확인 + 신청 저장을 한 트랜잭션에서 원자적으로 처리.
-- p_user_id는 서버가 로그인 세션을 확인한 뒤 넘긴다.
create or replace function apply_to_class(p_class_id uuid, p_user_id uuid, p_name text)
returns json
language plpgsql
set search_path = public
as $$
declare
  v_cap int;
  v_cnt int;
begin
  -- 클래스 행을 잠근다: 같은 클래스에 대한 동시 신청은 여기서 한 줄로 선다
  select capacity into v_cap from classes where id = p_class_id for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  if exists (select 1 from signups where class_id = p_class_id and user_id = p_user_id) then
    return json_build_object('ok', false, 'reason', 'already');
  end if;

  select count(*) into v_cnt from signups where class_id = p_class_id;
  if v_cnt >= v_cap then
    return json_build_object('ok', false, 'reason', 'full');
  end if;

  insert into signups (class_id, user_id, name) values (p_class_id, p_user_id, trim(p_name));
  return json_build_object('ok', true, 'remaining', v_cap - v_cnt - 1);
end;
$$;

-- 함수도 서버 키로만 호출 가능하게
revoke execute on function apply_to_class(uuid, uuid, text) from public, anon, authenticated;
grant execute on function apply_to_class(uuid, uuid, text) to service_role;

-- 샘플 클래스 (원하는 값으로 수정)
insert into classes (title, starts_at, capacity)
select '원데이 클래스', '2026-11-21 14:00:00+09', 10
where not exists (select 1 from classes);
