-- 원데이 클래스 신청: Supabase SQL Editor에서 한 번 실행하세요.

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

-- RLS 켜고 정책은 만들지 않음 → 공개(anon) 키로는 읽기/쓰기 불가. 서버 키만 접근.
alter table classes enable row level security;
alter table signups enable row level security;

-- 정원 확인 + 신청 저장을 한 트랜잭션에서 원자적으로 처리
create or replace function apply_to_class(p_class_id uuid, p_name text)
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

  select count(*) into v_cnt from signups where class_id = p_class_id;
  if v_cnt >= v_cap then
    return json_build_object('ok', false, 'reason', 'full');
  end if;

  insert into signups (class_id, name) values (p_class_id, trim(p_name));
  return json_build_object('ok', true, 'remaining', v_cap - v_cnt - 1);
end;
$$;

-- 함수도 서버 키로만 호출 가능하게
revoke execute on function apply_to_class(uuid, text) from public, anon, authenticated;
grant execute on function apply_to_class(uuid, text) to service_role;

-- 샘플 클래스 (원하는 값으로 수정)
insert into classes (title, starts_at, capacity)
select '핸드드립 커피 원데이 클래스', '2026-11-21 14:00:00+09', 10
where not exists (select 1 from classes);
