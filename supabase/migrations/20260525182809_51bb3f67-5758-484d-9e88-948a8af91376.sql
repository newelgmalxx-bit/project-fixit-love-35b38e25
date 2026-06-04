
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read media"
on storage.objects for select
using (bucket_id = 'media');

create policy "Authenticated upload media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media');

create policy "Authenticated update media"
on storage.objects for update
to authenticated
using (bucket_id = 'media');

create policy "Authenticated delete media"
on storage.objects for delete
to authenticated
using (bucket_id = 'media');
