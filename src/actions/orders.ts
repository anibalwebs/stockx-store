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

  // The database validates catalog prices and writes header + lines atomically.
  // No prices, titles, status or total supplied by the browser are accepted.
  const { data, error } = await supabase.rpc('create_store_order', {
    cart_items: cartItems.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })),
    delivery_method: deliveryMethod,
    payment_method: paymentMethod,
  })
  if (error || !data) {
    console.error('Error al registrar el pedido:', error?.code)
    return { success: false as const, error: error?.code === 'P0001'
      ? error.message : 'Hubo un error al registrar el pedido. Intenta nuevamente.' }
  }
  const confirmed = data as {
    shortId: string;
    items: { title: string; size: string; quantity: number; price: number }[];
    total: number;
    subtotal: number;
  }

  // --- REGISTRAR LA COOKIE AL TENER ÉXITO ---
  // Guardamos la hora actual. La cookie dura un poco más de 1 minuto en el navegador
  cookieStore.set('last_order_time', Date.now().toString(), { 
    httpOnly: true, // No accesible por JavaScript del cliente (más seguro)
    maxAge: 120 // Expira en 2 minutos
  })
  // ------------------------------------------

  return { success: true as const, ...confirmed }
}