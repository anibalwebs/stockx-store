import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductClient from './ProductClient'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 1. Buscar el producto principal
  const { data: product } = await supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, description, gender, product_type, brand_id,
      brands ( name ),
      product_images ( image_url, is_primary ),
      product_variants ( size )
    `)
    .eq('slug', resolvedParams.slug)
    .single()

  if (!product) {
    notFound()
  }

  // 2. Buscar productos recomendados de la misma marca (excluyendo el actual)
  const { data: relatedProducts } = await supabase
    .from('products')
    .select(`
      title, slug, base_price, sale_price, gender,
      brands ( name ),
      product_images ( image_url, is_primary )
    `)
    .eq('brand_id', product.brand_id)
    .neq('id', product.id)
    .limit(4)

  // 3. Buscar productos en oferta para la sección "Cashea" (excluyendo el actual)
  const { data: saleProducts } = await supabase
    .from('products')
    .select(`
      title, slug, base_price, sale_price, gender,
      brands ( name ),
      product_images ( image_url, is_primary )
    `)
    .not('sale_price', 'is', null)
    .neq('id', product.id)
    .limit(4)

  return (
    <div className="min-h-screen bg-white">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProductClient 
        product={product as any} 
        relatedProducts={relatedProducts as any || []}
        saleProducts={saleProducts as any || []}
      />
    </div>
  )
}