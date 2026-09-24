'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper interno para verificar el PIN con Supabase Auth
async function verifyAdminPin(pin: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) return { error: 'No hay sesión activa' }
  
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: pin,
  })
  
  if (error) return { error: 'PIN incorrecto. Acción denegada.' }
  return { success: true, supabase }
}

// ==========================================
// ACCIONES DE CATEGORÍAS
// ==========================================
export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string
  const pin = formData.get('pin') as string

  if (!name) return { error: 'El nombre es obligatorio' }
  if (!pin) return { error: 'El PIN es obligatorio' }

  const auth = await verifyAdminPin(pin)
  if (auth.error) return { error: auth.error }

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const { error } = await auth.supabase!.from('categories').insert([{ name, slug }])
  
  if (error) return { error: 'Error al guardar en la base de datos' }
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function toggleCategory(id: string, currentStatus: boolean, pin: string) {
  const auth = await verifyAdminPin(pin)
  if (auth.error) return { error: auth.error }

  const { error } = await auth.supabase!.from('categories').update({ is_active: !currentStatus }).eq('id', id)
  if (error) return { error: 'Error al actualizar el estado' }
  
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteCategory(id: string, pin: string) {
  const auth = await verifyAdminPin(pin)
  if (auth.error) return { error: auth.error }

  const { error } = await auth.supabase!.from('categories').delete().eq('id', id)
  if (error) return { error: 'Error al eliminar la categoría. Verifica que no tenga productos asociados.' }
  
  revalidatePath('/admin/categories')
  return { success: true }
}

// ==========================================
// ACCIONES DE MARCAS
// ==========================================
export async function addBrand(formData: FormData) {
  const name = formData.get('name') as string
  const pin = formData.get('pin') as string

  if (!name) return { error: 'El nombre es obligatorio' }
  if (!pin) return { error: 'El PIN es obligatorio' }

  const auth = await verifyAdminPin(pin)
  if (auth.error) return { error: auth.error }

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const { error } = await auth.supabase!.from('brands').insert([{ name, slug }])
  
  if (error) return { error: 'Error al guardar en la base de datos' }
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function toggleBrand(id: string, currentStatus: boolean, pin: string) {
  const auth = await verifyAdminPin(pin)
  if (auth.error) return { error: auth.error }

  const { error } = await auth.supabase!.from('brands').update({ is_active: !currentStatus }).eq('id', id)
  if (error) return { error: 'Error al actualizar el estado' }
  
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteBrand(id: string, pin: string) {
  const auth = await verifyAdminPin(pin)
  if (auth.error) return { error: auth.error }

  const { error } = await auth.supabase!.from('brands').delete().eq('id', id)
  if (error) return { error: 'Error al eliminar la marca. Verifica que no tenga productos asociados.' }
  
  revalidatePath('/admin/categories')
  return { success: true }
}