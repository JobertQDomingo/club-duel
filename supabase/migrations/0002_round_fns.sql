-- Round lifecycle. Each function locks a parent row first, so concurrent calls serialize.

-- Opens round N+1 with 2 empty lineups. Previous round must be locked with every match done.
create or replace function open_round(p_tournament_id uuid) returns uuid
language plpgsql set search_path = public as $$
declare
  t tournaments;
  prev rounds;
  new_id uuid;
begin
  select * into t from tournaments where id = p_tournament_id for update;
  if not found then raise exception 'Tournament not found'; end if;
  if t.status = 'ended' then raise exception 'Tournament has ended'; end if;

  select * into prev from rounds where tournament_id = p_tournament_id order by number desc limit 1;
  if found and (prev.locked_at is null
      or exists (select 1 from matches where round_id = prev.id and status <> 'done')) then
    raise exception 'Round % is not finished', prev.number;
  end if;

  insert into rounds (tournament_id, number, pairs)
  values (p_tournament_id, coalesce(prev.number, 0) + 1, t.pairs_per_round)
  returning id into new_id;
  insert into lineups (round_id, club_id) select new_id, id from clubs where tournament_id = p_tournament_id;
  update tournaments set status = 'active' where id = p_tournament_id and status = 'setup';
  return new_id;
end $$;

-- Marks a full, valid lineup submitted. Returns true if this call locked the round
-- (both lineups in), which also creates matches 1..P.
create or replace function submit_lineup(p_lineup_id uuid) returns boolean
language plpgsql set search_path = public as $$
declare
  l lineups;
  r rounds;
begin
  select * into l from lineups where id = p_lineup_id;
  if not found then raise exception 'Lineup not found'; end if;
  select * into r from rounds where id = l.round_id for update;
  if r.locked_at is not null then raise exception 'Round is already locked'; end if;

  if (select count(*) from lineup_pairs where lineup_id = l.id and slot between 1 and r.pairs) <> r.pairs then
    raise exception 'Fill all % pairs before submitting', r.pairs;
  end if;
  -- 2P distinct players, all from this club
  if (select count(distinct pl.id)
        from lineup_pairs lp
        cross join lateral (values (lp.player1_id), (lp.player2_id)) v(pid)
        join players pl on pl.id = v.pid and pl.club_id = l.club_id
       where lp.lineup_id = l.id and lp.slot between 1 and r.pairs) <> 2 * r.pairs then
    raise exception 'A player is used twice or is not on this club';
  end if;

  update lineups set submitted_at = coalesce(submitted_at, now()) where id = l.id;
  if exists (select 1 from lineups where round_id = r.id and submitted_at is null) then
    return false;
  end if;

  update rounds set locked_at = now() where id = r.id;
  insert into matches (round_id, slot) select r.id, g from generate_series(1, r.pairs) g;
  return true;
end $$;

-- Withdraws a submission. Only before the round locks.
create or replace function unsubmit_lineup(p_lineup_id uuid) returns void
language plpgsql set search_path = public as $$
declare
  l lineups;
  r rounds;
begin
  select * into l from lineups where id = p_lineup_id;
  if not found then raise exception 'Lineup not found'; end if;
  select * into r from rounds where id = l.round_id for update;
  if r.locked_at is not null then raise exception 'Round is locked'; end if;
  update lineups set submitted_at = null where id = l.id;
end $$;

-- Server (service role) only; Supabase grants new functions to anon/authenticated by default.
revoke execute on function open_round(uuid), submit_lineup(uuid), unsubmit_lineup(uuid) from public, anon, authenticated;
grant execute on function open_round(uuid), submit_lineup(uuid), unsubmit_lineup(uuid) to service_role;
