import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()

  // Consultar todos los productos activos, incluyendo su imagen principal
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, gender,
      product_images ( image_url )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50">
      
      {/* Navegación Básica (Header) */}


      {/* Hero Section (Banner de bienvenida) */}
      <section className="bg-black text-white py-20 px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4">
          Pisa Fuerte
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Descubre la nueva colección de calzado exclusivo. Importación directa y modelos bajo pedido.
        </p>
      </section>

      {/* Cuadrícula de Productos (Catálogo) */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-10 tracking-tight">Últimos Lanzamientos</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products?.map((product) => {
            // Extraer la primera imagen del arreglo de imágenes
            const imageUrl = product.product_images?.[0]?.image_url || '/placeholder.png'
            
            return (
              <Link href={`/product/${product.slug}`} key={product.id} className="group cursor-pointer">
                <div className="bg-white rounded-lg overflow-hidden border border-zinc-200 transition-all hover:shadow-lg hover:border-zinc-300">
                  
                  {/* Contenedor de la Imagen */}
                  <div className="aspect-square relative bg-zinc-100 overflow-hidden">
                    <Image 
                      src={imageUrl} 
                      alt={product.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    {/* Etiqueta de Oferta si tiene sale_price */}
                    {product.sale_price && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        OFERTA
                      </div>
                    )}
                  </div>

                  {/* Información del Producto */}
                  <div className="p-4">
                    <p className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">{product.gender}</p>
                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:underline underline-offset-4 line-clamp-1">{product.title}</h3>
                    
                    <div className="flex items-end gap-2">
                      {product.sale_price ? (
                        <>
                          <span className="font-black text-lg text-red-600">${product.sale_price}</span>
                          <span className="text-sm text-zinc-400 line-through mb-0.5">${product.base_price}</span>
                        </>
                      ) : (
                        <span className="font-black text-lg">${product.base_price}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        
        {(!products || products.length === 0) && (
          <p className="text-center text-zinc-500 py-20">Aún no hay productos en el catálogo.</p>
        )}
      </main>

    </div>
  )
}