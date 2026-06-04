insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;

create policy "Public can read avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Anyone can upload avatars"
on storage.objects for insert
with check (bucket_id = 'avatars');

create policy "Anyone can update avatars"
on storage.objects for update
using (bucket_id = 'avatars');