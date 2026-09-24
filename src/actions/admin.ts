'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function verifyAndUpdateOrderStatus(orderId: string, newStatus: string, pin: string) {
  const supabase = await createClient()
  
  // 1. Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { success: false, error: 'No hay sesión activa' }
  }

  // 2. Verificar el PIN (que actúa como contraseña)
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: pin,
  })

  if (authError) {
    return { success: false, error: 'PIN incorrecto. Acción denegada.' }
  }

  // 3. Si el PIN es correcto, actualizamos el estado
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (updateError) {
    return { success: false, error: 'Error al actualizar la base de datos.' }
  }

  revalidatePath('/admin/orders')
  return { success: true }
}