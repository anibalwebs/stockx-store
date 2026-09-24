'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  // 1. Extraer todos los datos
  const title = formData.get('title') as string
  const base_price = parseFloat(formData.get('base_price') as string)
  
  // Si hay precio de oferta, lo convertimos a número, si no, queda en null
  const sale_price_str = formData.get('sale_price') as string
  const sale_price = sale_price_str ? parseFloat(sale_price_str) : null

  const description = formData.get('description') as string
  const category_id = formData.get('category_id') as string
  const brand_id = formData.get('brand_id') as string
  
  // Nuevos campos
  const gender = formData.get('gender') as string
  const product_type = formData.get('product_type') as string
  
  // Obtener TODAS las tallas seleccionadas (checkboxes)
  const sizes = formData.getAll('sizes') as string[]
  const imageFile = formData.get('image') as File

  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

  // 3. Insertar el Producto Principal con los nuevos datos
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([{ 
      title, slug, base_price, sale_price, description, 
      category_id, brand_id, gender, product_type 
    }])
    .select()
    .single()

  if (productError || !product) {
    console.error("Error al crear producto:", productError?.message)
    return
  }

  // 4. Subir la Imagen a Supabase Storage
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${product.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(fileName, imageFile)

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName)
      await supabase.from('product_images').insert([{ 
        product_id: product.id, image_url: publicUrlData.publicUrl, is_primary: true 
      }])
    }
  }

  // 5. Crear las Variantes (Ahora usamos is_available en lugar de stock)
  if (sizes.length > 0) {
    const variantsToInsert = sizes.map(size => ({
      product_id: product.id,
      size: size,
      is_available: true, // Indica que la talla se seleccionó como disponible
      price: sale_price || base_price
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

// ==========================================
// CONSULTAS DE CATEGORÍAS Y MARCAS ACTIVAS
// ==========================================

export async function getActiveCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error("Error al obtener categorías activas:", error.message)
    return []
  }

  return data
}

export async function getActiveBrands() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('brands')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error("Error al obtener marcas activas:", error.message)
    return []
  }

  return data
}

// ==========================================
// OTRAS ACCIONES DEL MÓDULO DE PRODUCTOS
// ==========================================

export async function getProductsList() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories ( name ),
      brands ( name ),
      product_images ( image_url, is_primary )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error al obtener productos:", error.message)
    return []
  }

  return data
}

export async function verifyAndUpdateProductStatus(productId: string, isActive: boolean, pin: string) {
  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  // 2. Verificar el PIN (contraseña del usuario actual)
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: pin,
  })

  if (authError) {
    return { success: false, error: 'PIN incorrecto' }
  }

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)

  if (error) {
    console.error("Error al actualizar el estado del producto:", error.message)
    return { success: false, error: 'Error al cambiar el estado del producto.' }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

// ==========================================
// EDICIÓN DE PRODUCTOS
// ==========================================

export async function getProductById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images ( image_url, is_primary ),
      product_variants ( size, is_available )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error("Error al obtener producto:", error.message)
    return null
  }

  return data
}

export async function updateProduct(productId: string, formData: FormData, pin: string) {
  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  // 2. Validar PIN contra Supabase Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: pin,
  })

  if (authError) {
    return { success: false, error: 'PIN incorrecto' }
  }

  try {
    // 3. Extraer datos del formulario
    const title = formData.get('title') as string
    const base_price = parseFloat(formData.get('base_price') as string)
    const sale_price_str = formData.get('sale_price') as string
    const sale_price = sale_price_str ? parseFloat(sale_price_str) : null
    const description = formData.get('description') as string
    const category_id = formData.get('category_id') as string
    const brand_id = formData.get('brand_id') as string
    const gender = formData.get('gender') as string
    const product_type = formData.get('product_type') as string
    const is_active = formData.get('is_active') === 'true' // Control de estado activo/inactivo
    const sizes = formData.getAll('sizes') as string[]
    const imageFile = formData.get('image') as File | null

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

    // 4. Actualizar Producto Principal
    const { error: productError } = await supabase
      .from('products')
      .update({ 
        title, slug, base_price, sale_price, description, 
        category_id, brand_id, gender, product_type, is_active 
      })
      .eq('id', productId)

    if (productError) throw productError

    // 5. Actualizar Imagen (solo si se seleccionó un archivo nuevo)
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(fileName, imageFile)

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName)
        
        await supabase.from('product_images').delete().eq('product_id', productId)
        await supabase.from('product_images').insert([{ 
          product_id: productId, image_url: publicUrlData.publicUrl, is_primary: true 
        }])
      }
    }

    // 6. Actualizar Variantes (Tallas)
    await supabase.from('product_variants').delete().eq('product_id', productId)
    
    if (sizes.length > 0) {
      const variantsToInsert = sizes.map(size => ({
        product_id: productId,
        size: size,
        is_available: true,
        price: sale_price || base_price
      }))
      await supabase.from('product_variants').insert(variantsToInsert)
    }

    revalidatePath('/admin/products')
    return { success: true }

  } catch (error: any) {
    console.error("Error al actualizar:", error)
    return { success: false, error: 'Ocurrió un error al guardar los cambios.' }
  }
}