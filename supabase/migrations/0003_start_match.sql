-- Puts a pending match live on a free court. Locks the round row so concurrent starts serialize;
-- the one_live_per_court index is the busy-court guard. Matches only exist once a round is locked.
create or replace function start_match(p_match_id uuid, p_court_id uuid) returns void
language plpgsql set search_path = public as $$
declare
  m matches;
  r rounds;
begin
  select * into m from matches where id = p_match_id;
  if not found then raise exception 'Match not found'; end if;
  select * into r from rounds where id = m.round_id for update;
  if (select status from tournaments where id = r.tournament_id) = 'ended' then
    raise exception 'Tournament has ended';
  end if;
  if not exists (select 1 from courts where id = p_court_id and tournament_id = r.tournament_id) then
    raise exception 'Court not found';
  end if;

  update matches set status = 'live', court_id = p_court_id, started_at = now()
   where id = m.id and status = 'pending';
  if not found then raise exception 'Match % has already started', m.slot; end if;
exception when unique_violation then
  raise exception 'Court is busy';
end $$;

revoke execute on function start_match(uuid, uuid) from public, anon, authenticated;
grant execute on function start_match(uuid, uuid) to service_role;
