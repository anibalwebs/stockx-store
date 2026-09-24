import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductClient from './ProductClient'

// Next.js pasa el "slug" a través de los params de la URL
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Buscar el producto por su slug, trayendo sus relaciones
  const { data: product } = await supabase
    .from('products')
    .select(`
      title, base_price, sale_price, description, gender, product_type,
      brands ( name ),
      product_images ( image_url ),
      product_variants ( size )
    `)
    .eq('slug', resolvedParams.slug)
    .single()

  // Si no existe, mandamos a una página de error 404
  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProductClient product={product as any} />
    </div>
  )
}