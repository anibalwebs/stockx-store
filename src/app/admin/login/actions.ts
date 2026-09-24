'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginWithPin(email: string, pin: string) {
  const supabase = await createClient()

  // Ahora usa el correo que recibe de la interfaz en lugar de uno fijo
  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: pin, 
  })

  if (error) {
    return { success: false, error: 'PIN incorrecto' }
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}