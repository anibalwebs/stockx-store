'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface CartItem {
  product_id: string;
  size: string;
  quantity: number;
}

export async function createOrder(
  cartItems: CartItem[],
  deliveryMethod: string,
  paymentMethod: string
) {
  if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 100 ||
      cartItems.some(item => !item || typeof item.product_id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_id) ||
        typeof item.size !== 'string' || !item.size.trim() ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) {
    return { success: false as const, error: 'El carrito contiene productos o cantidades inválidas.' }
  }
  // --- CAPA DE SEGURIDAD: COOLDOWN DE 1 MINUTO ---
  const cookieStore = await cookies()
  const lastOrderTime = cookieStore.get('last_order_time')

  if (lastOrderTime) {
    const timePassed = Date.now() - parseInt(lastOrderTime.value)
    if (timePassed < 60000) { // 60,000 milisegundos = 1 minuto
      return { 
        success: false as const, 
        error: 'Por favor espera un minuto antes de hacer otro pedido para evitar spam.' 
      }
    }
  }
  // -----------------------------------------------

  const supabase = await createClient()

  const { data: products, error: catalogError } = await supabase
    .from('products')
    .select('id, title, base_price, sale_price, is_active, product_variants(size, is_available)')
    .in('id', [...new Set(cartItems.map(item => item.product_id))])

  if (catalogError || !products) {
    return { success: false as const, error: 'No pudimos comprobar los precios. Intenta nuevamente.' }
  }

  const validatedItems = []
  let totalCents = 0
  let subtotalCents = 0
  for (const item of cartItems) {
    const product = products.find(product => product.id === item.product_id)
    const variant = product?.product_variants.find(variant => variant.size === item.size)
    if (!product?.is_active || !variant || variant.is_available !== true) {
      return { success: false as const, error: 'Un producto o talla ya no está disponible. Revisa tu carrito.' }
    }
    const price = Number(product.sale_price ?? product.base_price)
    const basePrice = Number(product.base_price)
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(basePrice) || basePrice <= 0) {
      return { success: false as const, error: 'Un producto tiene un precio inválido. Contacta a la tienda.' }
    }
    const cents = Math.round(price * 100)
    totalCents += cents * item.quantity
    subtotalCents += Math.round(basePrice * 100) * item.quantity
    if (!Number.isSafeInteger(totalCents) || !Number.isSafeInteger(subtotalCents)) {
      return { success: false as const, error: 'El importe del pedido es inválido.' }
    }
    validatedItems.push({ title: product.title, size: variant.size, quantity: item.quantity, price: cents / 100 })
  }
  const totalAmount = totalCents / 100

  const shortId = `PED-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ 
      short_id: shortId,
      total_amount: totalAmount,
      status: 'Pendiente',
      delivery_method: deliveryMethod || 'Por definir', // <-- Asignamos la variable
      payment_method: paymentMethod || 'Por definir'    // <-- Asignamos la variable
    }])
    .select()
    .single()

  if (orderError || !order) {
    console.error("Error al crear el pedido:", orderError?.message)
    return { success: false as const, error: 'Hubo un error al registrar el pedido.' }
  }

  const itemsToInsert = validatedItems.map(item => ({
    order_id: order.id,
    title: item.title,
    size: item.size,
    quantity: item.quantity,
    price: item.price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) {
    console.error("Error al guardar los items del pedido:", itemsError.message)
    return { success: false as const, error: 'Hubo un error al registrar los productos.' }
  }

  // --- REGISTRAR LA COOKIE AL TENER ÉXITO ---
  // Guardamos la hora actual. La cookie dura un poco más de 1 minuto en el navegador
  cookieStore.set('last_order_time', Date.now().toString(), { 
    httpOnly: true, // No accesible por JavaScript del cliente (más seguro)
    maxAge: 120 // Expira en 2 minutos
  })
  // ------------------------------------------

  return { success: true as const, shortId, items: validatedItems, total: totalAmount, subtotal: subtotalCents / 100 }
}