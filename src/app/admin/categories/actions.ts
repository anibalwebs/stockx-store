'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string
  if (!name) return

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  
  const supabase = await createClient()
  const { error } = await supabase.from('categories').insert([{ name, slug }])
  
  if (error) {
    console.error("Error al guardar la categoría:", error.message)
    return
  }
  
  revalidatePath('/admin/categories')
}

export async function addBrand(formData: FormData) {
  const name = formData.get('name') as string
  if (!name) return

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  
  const supabase = await createClient()
  const { error } = await supabase.from('brands').insert([{ name, slug }])
  
  if (error) {
    console.error("Error al guardar la marca:", error.message)
    return
  }
  
  revalidatePath('/admin/categories')
}