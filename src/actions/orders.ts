'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface CartItem {
  id: string;
  title: string;
  size: string;
  price: number;
  base_price: number;
  quantity: number;
  image: string;
}

export async function createOrder(
  cartItems: CartItem[], 
  totalAmount: number,
  deliveryMethod: string, // <-- Nueva variable para el método de entrega
  paymentMethod: string   // <-- Nueva variable para el método de pago
) {
  // --- CAPA DE SEGURIDAD: COOLDOWN DE 1 MINUTO ---
  const cookieStore = await cookies()
  const lastOrderTime = cookieStore.get('last_order_time')

  if (lastOrderTime) {
    const timePassed = Date.now() - parseInt(lastOrderTime.value)
    if (timePassed < 60000) { // 60,000 milisegundos = 1 minuto
      return { 
        success: false, 
        error: 'Por favor espera un minuto antes de hacer otro pedido para evitar spam.' 
      }
    }
  }
  // -----------------------------------------------

  const supabase = await createClient()

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
    return { success: false, error: 'Hubo un error al registrar el pedido.' }
  }

  const itemsToInsert = cartItems.map(item => ({
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
    return { success: false, error: 'Hubo un error al registrar los productos.' }
  }

  // --- REGISTRAR LA COOKIE AL TENER ÉXITO ---
  // Guardamos la hora actual. La cookie dura un poco más de 1 minuto en el navegador
  cookieStore.set('last_order_time', Date.now().toString(), { 
    httpOnly: true, // No accesible por JavaScript del cliente (más seguro)
    maxAge: 120 // Expira en 2 minutos
  })
  // ------------------------------------------

  return { success: true, shortId: shortId }
}