-- Run after both migrations. Always rollback fixtures and test orders.
begin;
do $$
declare
  test_product_id uuid := gen_random_uuid();
  test_category_id uuid := gen_random_uuid();
  test_brand_id uuid := gen_random_uuid();
  test_image_id uuid := gen_random_uuid();
  admin_id uuid;
  result jsonb;
  saved_order uuid;
  baseline integer;
  rejected boolean;
  invalid jsonb;
begin
  select id into admin_id from auth.users order by created_at limit 1;
  assert admin_id is not null, 'An existing admin account is required';
  insert into public.products(id,title,slug,base_price,sale_price,is_active)
    values(test_product_id,'Checkout permission test','permission-test-'||test_product_id,100,80,true);
  insert into public.product_variants(product_id,size,is_available) values(test_product_id,'42',true),(test_product_id,'43',false);

  perform set_config('role','anon',true);
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  assert exists(select 1 from public.products where id=test_product_id), 'Public catalog must remain readable';
  result := public.create_store_order(jsonb_build_array(jsonb_build_object(
    'product_id',test_product_id,'size','42','quantity',2,'price',1,'title','Forged','total',2)), 'Delivery','Pago móvil');
  assert (result->>'total')::numeric=160, 'Forged prices must not affect total';
  assert (result->>'subtotal')::numeric=200, 'Catalog base price must determine subtotal';
  assert result->'items'->0->>'title'='Checkout permission test', 'Title must come from catalog';
  rejected := false;
  begin perform * from public.orders; exception when insufficient_privilege then rejected := true; end;
  assert rejected, 'Anonymous order reads must be denied';
  rejected := false;
  begin insert into public.orders(short_id,total_amount,status) values('FORGED',1,'Confirmado');
    exception when insufficient_privilege then rejected := true; end;
  assert rejected, 'Anonymous direct order inserts must be denied';
  rejected := false;
  begin insert into public.order_items(title,size,quantity,price) values('FORGED','42',1,1);
    exception when insufficient_privilege then rejected := true; end;
  assert rejected, 'Anonymous direct line inserts must be denied';
  rejected := false;
  begin update public.orders set status='Confirmado'; exception when insufficient_privilege then rejected := true; end;
  assert rejected, 'Anonymous status updates must be denied';
  rejected := false;
  begin update public.products set base_price=1 where id=test_product_id; exception when insufficient_privilege then rejected := true; end;
  -- An RLS-filtered no-op is also denial; verify the real price as admin below.

  perform set_config('role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',admin_id)::text,true);
  select id into saved_order from public.orders where short_id=result->>'shortId';
  assert saved_order is not null, 'Admin must be able to read created order';
  assert (select count(*)=1 from public.order_items where order_id=saved_order), 'Admin must read order lines';
  update public.orders set status='Confirmado' where id=saved_order;
  assert (select status='Confirmado' from public.orders where id=saved_order), 'Admin status updates must work';
  rejected := false;
  begin update public.orders set total_amount=1 where id=saved_order; exception when insufficient_privilege then rejected := true; end;
  assert rejected, 'Admin may change status, not trusted totals';
  assert (select base_price=100 from public.products where id=test_product_id), 'Anonymous catalog changes must be denied';
  insert into public.categories(id,name,slug) values(test_category_id,'Permission test','test-'||test_category_id);
  update public.categories set name='Updated test' where id=test_category_id;
  insert into public.brands(id,name,slug) values(test_brand_id,'Permission test','test-'||test_brand_id);
  update public.brands set name='Updated test' where id=test_brand_id;
  update public.products set base_price=99,category_id=test_category_id,brand_id=test_brand_id where id=test_product_id;
  -- Unambiguous column assignment for PL/pgSQL variable names.
  insert into public.product_images(id,product_id,image_url,is_primary) values(test_image_id,test_product_id,'https://example.invalid/test.png',true);
  update public.product_images set is_primary=false where id=test_image_id;
  delete from public.product_images where id=test_image_id;
  update public.product_variants set is_available=false where product_id=test_product_id and size='43';
  delete from public.product_variants where product_id=test_product_id and size='43';
  update public.products set category_id=null,brand_id=null where id=test_product_id;
  delete from public.categories where id=test_category_id;
  delete from public.brands where id=test_brand_id;
  perform set_config('role','postgres',true);
  select count(*) into baseline from public.orders;

  perform set_config('role','anon',true);
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  for invalid in select value from jsonb_array_elements(jsonb_build_array(
    '[]'::jsonb,
    jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity',0)),
    jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity',-1)),
    jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity',1.5)),
    jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity','2')),
    jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','43','quantity',1)),
    jsonb_build_array(jsonb_build_object('product_id',gen_random_uuid(),'size','42','quantity',1)),
    jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity',100),jsonb_build_object('product_id',test_product_id,'size','42','quantity',1)),
    jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity',1),jsonb_build_object('product_id',gen_random_uuid(),'size','42','quantity',1))
  )) loop
    rejected:=false;
    begin perform public.create_store_order(invalid,'Delivery','Pago móvil'); exception when raise_exception then rejected:=true; end;
    assert rejected,'Invalid cart must be rejected';
  end loop;
  rejected:=false;
  begin perform public.create_store_order(jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity',1)),'Invalid','Pago móvil');
    exception when raise_exception then rejected:=true; end;
  assert rejected,'Invalid delivery method must be rejected';
  perform set_config('role','postgres',true);
  assert (select count(*)=baseline from public.orders),'Failed orders must leave no partial rows';
  update public.products set is_active=false where id=test_product_id;
  perform set_config('role','anon',true);
  rejected:=false;
  begin perform public.create_store_order(jsonb_build_array(jsonb_build_object('product_id',test_product_id,'size','42','quantity',1)),'Delivery','Pago móvil');
    exception when raise_exception then rejected:=true; end;
  assert rejected,'Inactive products must be rejected';
  perform set_config('role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',admin_id)::text,true);
  delete from public.product_variants where product_id=test_product_id;
  delete from public.products where id=test_product_id;
end $$;
rollback;
