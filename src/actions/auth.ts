'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAdmin(email: string, pin: string) {
  const cookieStore = await cookies()
  
  // 1. Sistema Anti-Spam (Fuerza Bruta)
  const attempts = parseInt(cookieStore.get('admin_login_attempts')?.value || '0')
  const blockUntil = parseInt(cookieStore.get('admin_login_blocked')?.value || '0')

  if (Date.now() < blockUntil) {
    const timeLeft = Math.ceil((blockUntil - Date.now()) / 1000)
    return { success: false, error: `Demasiados intentos. Por favor espera ${timeLeft} segundos.` }
  }

  // 2. Intentar iniciar sesión
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  })

  // 3. Manejar errores y sumar intentos
  if (error) {
    const newAttempts = attempts + 1
    if (newAttempts >= 5) {
      // Bloquear por 60 segundos (60000 ms)
      cookieStore.set('admin_login_blocked', (Date.now() + 60000).toString(), { httpOnly: true })
      cookieStore.set('admin_login_attempts', '0', { httpOnly: true })
      return { success: false, error: 'Por seguridad, el acceso ha sido bloqueado por 1 minuto.' }
    }
    cookieStore.set('admin_login_attempts', newAttempts.toString(), { httpOnly: true })
    return { success: false, error: 'Credenciales incorrectas. Verifica tu correo o PIN.' }
  }

  // 4. Éxito: Limpiar historial de errores
  cookieStore.set('admin_login_attempts', '0')
  cookieStore.delete('admin_login_blocked')

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Redirige al administrador a la pantalla de login tras cerrar sesión
  redirect('/admin/login')
}