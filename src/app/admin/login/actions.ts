'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Si hay error, redirigimos con un mensaje en la URL
    return redirect('/admin/login?message=Credenciales+incorrectas')
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin') // Si es exitoso, entra al panel
}