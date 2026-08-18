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

  // 5. Crear las Variantes (Solo registramos que la talla existe, no pedimos cantidad)
  if (sizes.length > 0) {
    const variantsToInsert = sizes.map(size => ({
      product_id: product.id,
      size: size,
      stock: 0, // 0 = Solo bajo consulta de disponibilidad
      price: sale_price || base_price
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}