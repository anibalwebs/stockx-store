-- ProductForm uploads images and deleteProduct removes their files. Retain the
-- existing upload policy and supply the missing bucket-scoped maintenance rights.
create policy "Admin puede leer archivos de productos" on storage.objects
  for select to authenticated using (bucket_id = 'product_images' and (select auth.uid()) is not null);
create policy "Admin puede actualizar archivos de productos" on storage.objects
  for update to authenticated using (bucket_id = 'product_images' and (select auth.uid()) is not null)
  with check (bucket_id = 'product_images' and (select auth.uid()) is not null);
create policy "Admin puede borrar archivos de productos" on storage.objects
  for delete to authenticated using (bucket_id = 'product_images' and (select auth.uid()) is not null);
