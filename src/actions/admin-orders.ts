'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOrders() {
  const supabase = await createClient()
  
  // Traemos los pedidos ordenados por los más recientes primero
  // Y le decimos que incluya los productos (order_items) asociados
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error al obtener pedidos:", error.message)
    return []
  }
  return data
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) {
    return { success: false, error: error.message }
  }
  
  // Refresca la caché de la página para que se vea el cambio al instante
  revalidatePath('/admin/orders')
  return { success: true }
}