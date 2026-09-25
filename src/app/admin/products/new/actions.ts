'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Helper para procesar e insertar las imágenes del producto (Mín. 0, Máx. 4)
async function processProductImages(supabase: any, productId: string, formData: FormData) {
  const imagesMetaRaw = formData.get('images_meta') as string | null
  const imageFiles = formData.getAll('images') as File[]

  if (imagesMetaRaw) {
    try {
      const meta = JSON.parse(imagesMetaRaw) as Array<{ type: 'existing' | 'new', url?: string, fileIndex?: number }>
      const itemsToProcess = meta.slice(0, 4) // Máximo 4 imágenes

      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i]
        const isPrimary = (i === 0) // La primera imagen siempre es la principal

        if (item.type === 'existing' && item.url) {
          await supabase.from('product_images').insert([{
            product_id: productId,
            image_url: item.url,
            is_primary: isPrimary
          }])
        } else if (item.type === 'new' && typeof item.fileIndex === 'number') {
          const file = imageFiles[item.fileIndex]
          if (file && file.size > 0 && file.name !== 'undefined') {
            const fileExt = file.name.split('.').pop()
            const fileName = `${productId}-${Date.now()}-${i}.${fileExt}`

            const { error: uploadError } = await supabase.storage
              .from('product_images')
              .upload(fileName, file)

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('product_images')
                .getPublicUrl(fileName)

              await supabase.from('product_images').insert([{
                product_id: productId,
                image_url: publicUrlData.publicUrl,
                is_primary: isPrimary
              }])
            } else {
              console.error("Error al subir la imagen al Storage:", uploadError.message)
            }
          }
        }
      }
      return
    } catch (e) {
      console.error("Error al procesar meta de imágenes:", e)
    }
  }

  // Fallback si no viene metadata específica
  const validFiles = imageFiles.filter(file => file && file.size > 0 && file.name !== 'undefined').slice(0, 4)
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i]
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}-${Date.now()}-${i}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(fileName, file)

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName)
      await supabase.from('product_images').insert([{
        product_id: productId,
        image_url: publicUrlData.publicUrl,
        is_primary: i === 0
      }])
    } else {
      console.error("Error al subir la imagen al Storage:", uploadError.message)
    }
  }
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  // 1. Extraer datos
  const title = formData.get('title') as string
  const base_price = parseFloat(formData.get('base_price') as string)
  
  const sale_price_str = formData.get('sale_price') as string
  const sale_price = sale_price_str ? parseFloat(sale_price_str) : null

  const description = formData.get('description') as string
  const category_id = formData.get('category_id') as string
  const brand_id = formData.get('brand_id') as string
  
  const gender = formData.get('gender') as string
  const product_type = formData.get('product_type') as string
  
  const sizes = formData.getAll('sizes') as string[]

  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

  // 2. Insertar el Producto Principal
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

  // 3. Subir e Insertar las Imágenes (Mín. 0, Máx. 4)
  await processProductImages(supabase, product.id, formData)

  // 4. Crear las Variantes
  if (sizes.length > 0) {
    const variantsToInsert = sizes.map(size => ({
      product_id: product.id,
      size: size,
      is_available: true,
      price: sale_price || base_price
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { success: false, error: 'Usuario no autenticado' }
  }

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: pin,
  })

  if (authError) {
    return { success: false, error: 'PIN incorrecto' }
  }

  try {
    const title = formData.get('title') as string
    const base_price = parseFloat(formData.get('base_price') as string)
    const sale_price_str = formData.get('sale_price') as string
    const sale_price = sale_price_str ? parseFloat(sale_price_str) : null
    const description = formData.get('description') as string
    const category_id = formData.get('category_id') as string
    const brand_id = formData.get('brand_id') as string
    const gender = formData.get('gender') as string
    const product_type = formData.get('product_type') as string
    const is_active = formData.get('is_active') === 'true'
    const sizes = formData.getAll('sizes') as string[]

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

    // 1. Actualizar Producto
    const { error: productError } = await supabase
      .from('products')
      .update({ 
        title, slug, base_price, sale_price, description, 
        category_id, brand_id, gender, product_type, is_active 
      })
      .eq('id', productId)

    if (productError) throw productError

    // 2. Reemplazar Imágenes
    await supabase.from('product_images').delete().eq('product_id', productId)
    await processProductImages(supabase, productId, formData)

    // 3. Actualizar Variantes (Tallas)
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

export async function deleteProduct(productId: string, pin: string) {
  const supabase = await createClient()

  // 1. Validar usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  // 2. Validar PIN
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: pin,
  })

  if (authError) {
    return { success: false, error: 'PIN incorrecto' }
  }

  try {
    // 3. (Opcional pero recomendado) Eliminar imágenes del Storage
    const { data: images } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId)
      
    if (images && images.length > 0) {
      const fileNames = images.map(img => {
        const urlParts = img.image_url.split('/')
        return urlParts[urlParts.length - 1]
      })
      await supabase.storage.from('product_images').remove(fileNames)
    }

    // 4. Eliminar registros de la BD (Si no tienes ON DELETE CASCADE configurado)
    await supabase.from('product_images').delete().eq('product_id', productId)
    await supabase.from('product_variants').delete().eq('product_id', productId)
    
    // 5. Eliminar el producto
    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId)
    if (deleteError) throw deleteError

    revalidatePath('/admin/products')
    return { success: true }

  } catch (error: any) {
    console.error("Error al eliminar producto:", error)
    return { success: false, error: 'Ocurrió un error al eliminar el producto.' }
  }
}