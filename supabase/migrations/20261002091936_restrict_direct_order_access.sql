-- Apply only after the new application checkout is deployed.
-- Keep catalog and storage permissions unchanged.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "Permitir crear pedidos" on public.orders;
drop policy if exists "Permitir agregar productos" on public.order_items;
drop policy if exists "Permitir leer pedidos" on public.orders;
drop policy if exists "Permitir leer items" on public.order_items;
drop policy if exists "Permitir actualizar pedidos" on public.orders;

-- Match the existing admin session model. Catalog admin policies already use
-- authenticated; this change does not revoke those existing capabilities.
create policy "Admin puede leer pedidos" on public.orders
  for select to authenticated using ((select auth.uid()) is not null);
create policy "Admin puede actualizar estado de pedidos" on public.orders
  for update to authenticated using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null and status in ('Pendiente', 'Confirmado', 'Cancelado'));
create policy "Admin puede leer items" on public.order_items
  for select to authenticated using ((select auth.uid()) is not null);

revoke all on public.orders, public.order_items from anon;
revoke insert, delete, truncate, references, trigger on public.orders, public.order_items from authenticated;
revoke update on public.orders from authenticated;
grant select on public.orders, public.order_items to authenticated;
grant update(status) on public.orders to authenticated;
revoke update on public.order_items from authenticated;

-- ProductForm uploads images and deleteProduct removes their files. Retain the
-- existing upload policy and supply the missing bucket-scoped maintenance rights.
create policy "Admin puede leer archivos de productos" on storage.objects
  for select to authenticated using (bucket_id = 'product_images' and (select auth.uid()) is not null);
create policy "Admin puede actualizar archivos de productos" on storage.objects
  for update to authenticated using (bucket_id = 'product_images' and (select auth.uid()) is not null)
  with check (bucket_id = 'product_images' and (select auth.uid()) is not null);
create policy "Admin puede borrar archivos de productos" on storage.objects
  for delete to authenticated using (bucket_id = 'product_images' and (select auth.uid()) is not null);
