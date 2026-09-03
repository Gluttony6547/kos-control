create table if not exists public.rooms (
  id integer primary key check (id between 1 and 5),
  name text not null,
  type text not null check (type in ('Besar', 'Kecil')),
  status text not null check (status in ('kosong', 'penuh')),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "Public can read rooms" on public.rooms;
create policy "Public can read rooms"
  on public.rooms for select
  to anon, authenticated
  using (true);

alter table public.rooms replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
end $$;

insert into public.rooms (id, name, type, status)
values
  (1, 'Kamar 1', 'Besar', 'penuh'),
  (2, 'Kamar 2', 'Besar', 'kosong'),
  (3, 'Kamar 3', 'Besar', 'penuh'),
  (4, 'Kamar 4', 'Kecil', 'kosong'),
  (5, 'Kamar 5', 'Kecil', 'kosong')
on conflict (id) do nothing;
