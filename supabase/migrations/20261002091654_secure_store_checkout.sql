-- Public guest checkout is intentional. The privileged implementation is kept
-- outside the exposed API schema and can only create validated pending orders.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.create_store_order(
  cart_items jsonb, delivery_method text, payment_method text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  item jsonb;
  product record;
  quantity integer;
  unit_price numeric;
  total numeric := 0;
  subtotal numeric := 0;
  confirmed_items jsonb := '[]'::jsonb;
  order_id uuid := gen_random_uuid();
  order_code text := 'PED-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
begin
  if cart_items is null or jsonb_typeof(cart_items) <> 'array' then
    raise exception 'El carrito es inválido.';
  end if;
  if jsonb_array_length(cart_items) not between 1 and 100 then
    raise exception 'El carrito debe contener entre 1 y 100 productos.';
  end if;
  if delivery_method is null or delivery_method not in ('Delivery', 'Pickup en tienda') or
     payment_method is null or payment_method not in ('Pago móvil', '($) Efectivo', 'Cashea', 'Binance') then
    raise exception 'Selecciona un método de entrega y pago válido.';
  end if;

  for item in select value from jsonb_array_elements(cart_items) loop
    if jsonb_typeof(item) <> 'object' or
       jsonb_typeof(item->'product_id') is distinct from 'string' or
       coalesce(item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
       jsonb_typeof(item->'size') is distinct from 'string' or
       length(coalesce(item->>'size', '')) not between 1 and 50 or
       jsonb_typeof(item->'quantity') is distinct from 'number' or
       coalesce(item->>'quantity', '') !~ '^[0-9]{1,3}$' then
      raise exception 'El carrito contiene productos o cantidades inválidas.';
    end if;
    quantity := (item->>'quantity')::integer;
    if quantity not between 1 and 100 then
      raise exception 'La cantidad debe ser un entero entre 1 y 100.';
    end if;
    if (select sum((entry->>'quantity')::integer)
        from jsonb_array_elements(confirmed_items) entry
        where entry->>'product_id' = item->>'product_id' and entry->>'size' = item->>'size') + quantity > 100 then
      raise exception 'La cantidad acumulada por talla no puede superar 100.';
    end if;

    select p.title, p.base_price, p.sale_price, v.size into product
    from public.products p join public.product_variants v on v.product_id = p.id
    where p.id = (item->>'product_id')::uuid and p.is_active = true
      and v.size = item->>'size' and v.is_available = true
    limit 1 for share of p, v;
    if not found then
      raise exception 'Un producto o talla ya no está disponible. Revisa tu carrito.';
    end if;
    unit_price := round(coalesce(product.sale_price, product.base_price), 2);
    if unit_price is null or unit_price <= 0 or unit_price::text in ('NaN', 'Infinity', '-Infinity') or
       product.base_price is null or product.base_price <= 0 or product.base_price::text in ('NaN', 'Infinity', '-Infinity') then
      raise exception 'Un producto tiene un precio inválido. Contacta a la tienda.';
    end if;
    total := total + unit_price * quantity;
    subtotal := subtotal + round(product.base_price, 2) * quantity;
    if total > 100000000 or subtotal > 100000000 then
      raise exception 'El importe del pedido es inválido.';
    end if;
    confirmed_items := confirmed_items || jsonb_build_array(jsonb_build_object(
      'product_id', item->>'product_id', 'title', product.title,
      'size', product.size, 'quantity', quantity, 'price', unit_price
    ));
  end loop;

  insert into public.orders(id, short_id, total_amount, status, delivery_method, payment_method)
  values(order_id, order_code, total, 'Pendiente', delivery_method, payment_method);
  insert into public.order_items(order_id, title, size, quantity, price)
  select order_id, x.title, x.size, x.quantity, x.price
  from jsonb_to_recordset(confirmed_items) as x(title text, size text, quantity integer, price numeric);

  return jsonb_build_object('shortId', order_code, 'items', confirmed_items, 'total', total, 'subtotal', subtotal);
end;
$$;
revoke all on function private.create_store_order(jsonb, text, text) from public;
grant execute on function private.create_store_order(jsonb, text, text) to anon, authenticated;

create or replace function public.create_store_order(cart_items jsonb, delivery_method text, payment_method text)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.create_store_order(cart_items, delivery_method, payment_method); $$;
revoke all on function public.create_store_order(jsonb, text, text) from public;
grant execute on function public.create_store_order(jsonb, text, text) to anon, authenticated;
