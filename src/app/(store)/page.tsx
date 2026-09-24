import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, 
  Truck, 
  Store, 
  MessageCircle, 
  Tag, 
  ChevronRight, 
  Smartphone,
  PackageCheck
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Consultar 4 productos NUEVOS que estén EN OFERTA
  const { data: newSaleProducts } = await supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, gender,
      product_images ( image_url )
    `)
    .not('sale_price', 'is', null)
    .order('id', { ascending: false }) // Ordenados por los últimos agregados
    .limit(4)

  // 2. Consultar 4 productos MÁS BARATOS (Para la sección de abajo)
  const { data: cheapestProducts } = await supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, gender,
      product_images ( image_url )
    `)
    .order('base_price', { ascending: true })
    .limit(4)

  // 3. Consultar Categorías Activas
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('name, slug')
    .order('name')
  
  const categories = categoriesData || [
    { name: 'Calzado', slug: 'calzado' }, 
    { name: 'Ropa', slug: 'ropa' }, 
    { name: 'Accesorios', slug: 'accesorios' }
  ]

  // 4. Consultar Marcas Activas
  const { data: brandsData } = await supabase
    .from('brands')
    .select('name, slug')
    .order('name')

  const brands = brandsData || [
    { name: 'Nike', slug: 'nike' }, 
    { name: 'Adidas', slug: 'adidas' }, 
    { name: 'Puma', slug: 'puma' }
  ]

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-16 font-sans">
      
      {/* =========================================
          1. HERO SECTION PRINCIPAL
      ========================================= */}
      <section className="px-4 pt-4 md:px-8 max-w-7xl mx-auto mb-10">
        <div className="relative bg-linear-to-br from-zinc-900 via-black to-zinc-800 text-white rounded-[2rem] p-8 md:p-14 overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 -left-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 max-w-xl">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md border border-white/10 text-red-300">
              Nueva Colección 2024
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-5">
              ELEVA TU <br/><span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-red-400">ESTILO.</span>
            </h1>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-8 max-w-md">
              Descubre la selección más exclusiva de sneakers y streetwear. Importación directa y piezas de edición limitada para destacar en cualquier lugar.
            </p>
            <Link href="/catalogo" className="inline-flex bg-white text-black font-bold py-3.5 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================
          2. SECCIÓN DE CATEGORÍAS
      ========================================= */}
      <section className="mb-8 max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Descubre tu estilo</h2>
            <p className="text-sm text-zinc-500 font-medium mt-1">Navega por nuestras colecciones principales y encuentra lo que buscas.</p>
          </div>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 md:flex-wrap">
          <Link href="/catalogo" className="whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold bg-black text-white shadow-md hover:bg-zinc-800 transition-all">
            Todo el catálogo
          </Link>
          {categories.map((cat) => (
            <Link 
              href={`/categoria/${cat.slug}`} 
              key={cat.slug}
              className="whitespace-nowrap px-6 py-3 rounded-full text-sm font-semibold bg-white text-zinc-600 border border-zinc-200 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================
          3. NUEVOS EN OFERTA (Sección Solicitada)
      ========================================= */}
      {newSaleProducts && newSaleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-black tracking-tight text-zinc-900">Nuevos en Oferta</h3>
            <Link href="/catalogo" className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
              Ver más <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {newSaleProducts.map((product) => {
              const imageUrl = product.product_images?.[0]?.image_url || '/placeholder.png'
              const savings = (product.base_price - product.sale_price!).toFixed(0)
              
              return (
                <Link href={`/product/${product.slug}`} key={`newsale-${product.id}`} className="group block h-full">
                  <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className="aspect-square relative bg-[#F4F4F5] rounded-xl overflow-hidden mb-4 shrink-0">
                      <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Tag className="w-2.5 h-2.5" />
                        OFERTA
                      </div>
                      <Image 
                        src={imageUrl} 
                        alt={product.title}
                        fill
                        className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="px-1 flex flex-col flex-1 pb-1">
                      <p className="text-[11px] text-red-500 font-bold mb-1 uppercase tracking-wider">{product.gender}</p>
                      <h3 className="font-bold text-sm md:text-base text-zinc-800 leading-tight mb-3 line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="mt-auto flex flex-col gap-1">
                        <span className="text-[11px] font-black text-red-600 bg-red-50 w-fit px-2 py-0.5 rounded border border-red-100">
                          Ahorras ${savings}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-black text-xl text-zinc-900">${product.sale_price}</span>
                          <span className="text-sm text-zinc-400 line-through font-medium">${product.base_price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* =========================================
          4. BANNER DE CASHEA
      ========================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-10">
        <div className="bg-[#FFDF00] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-yellow-500/10 text-black relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/40 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-7 h-7 text-black" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
                Paga con Cashea 
                <span className="bg-black text-white text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider font-bold">Sin Interés</span>
              </h3>
              <p className="text-zinc-800 text-sm md:text-base mt-1.5 font-medium leading-tight">
                Lleva tus sneakers hoy y divide tu pago en cómodas cuotas quincenales.
              </p>
            </div>
          </div>
          
          <Link href="/informacion-pagos" className="w-full md:w-auto bg-black text-white px-8 py-3.5 rounded-xl font-bold text-sm text-center hover:bg-zinc-800 transition-colors shadow-md relative z-10">
            Ver cómo funciona
          </Link>
        </div>
      </section>

      {/* =========================================
          5. SECCIÓN DE MARCAS
      ========================================= */}
      <section className="mb-12 max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Marcas Exclusivas</h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">La mejor calidad y diseño de la mano de los líderes mundiales.</p>
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2 md:flex-wrap">
          {brands.map((brand) => (
            <Link href={`/marca/${brand.slug}`} key={brand.slug} className="shrink-0 w-32 h-14 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 transition-all">
              <span className="font-black text-zinc-800 text-sm tracking-widest uppercase">{brand.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================
          6. CATÁLOGO POPULARES (Menor Precio)
      ========================================= */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Populares Ahora</h2>
            <p className="text-sm text-zinc-500 font-medium mt-1">Los modelos más buscados al mejor precio.</p>
          </div>
          <Link href="/catalogo" className="hidden md:flex items-center gap-2 text-sm font-bold text-black hover:text-red-600 transition-colors bg-white px-6 py-2.5 rounded-full border border-zinc-200 shadow-sm hover:border-red-200">
            Ver todo el catálogo <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {cheapestProducts?.map((product) => {
            const imageUrl = product.product_images?.[0]?.image_url || '/placeholder.png'
            const hasDiscount = product.sale_price && product.sale_price < product.base_price
            const savings = hasDiscount ? (product.base_price - product.sale_price).toFixed(0) : 0
            
            return (
              <Link href={`/product/${product.slug}`} key={product.id} className="group block h-full">
                <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 h-full flex flex-col">
                  
                  <div className="aspect-square relative bg-[#F4F4F5] rounded-xl overflow-hidden mb-4 shrink-0">
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Tag className="w-2.5 h-2.5" />
                        OFERTA
                      </div>
                    )}
                    
                    <Image 
                      src={imageUrl} 
                      alt={product.title}
                      fill
                      className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>

                  <div className="px-1 flex flex-col flex-1 pb-1">
                    <p className="text-[11px] text-red-500 font-bold mb-1 uppercase tracking-wider">{product.gender}</p>
                    <h3 className="font-bold text-sm md:text-base text-zinc-800 leading-tight mb-3 line-clamp-2">
                      {product.title}
                    </h3>
                    
                    <div className="mt-auto">
                      {hasDiscount ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-black text-red-600 bg-red-50 w-fit px-2 py-0.5 rounded border border-red-100">
                            Ahorras ${savings}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-black text-xl text-zinc-900">${product.sale_price}</span>
                            <span className="text-sm text-zinc-400 line-through font-medium">${product.base_price}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-black text-xl text-zinc-900 block mt-1">${product.base_price}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        
        <div className="mt-10 flex justify-center md:hidden">
            <Link href="/catalogo" className="flex items-center justify-center gap-2 text-sm font-bold text-black bg-white w-full py-4 rounded-full border border-zinc-200 shadow-sm active:bg-zinc-50 hover:bg-zinc-50 transition-colors">
              Ver todo el catálogo <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
      </main>

      {/* =========================================
          7. SECCIÓN UBICACIONES Y ENVÍOS
      ========================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-10">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-zinc-900">Nuestras Tiendas</h3>
          <p className="text-sm text-zinc-500 font-medium mt-1">Visítanos y vive la experiencia de probarte tus pares favoritos en persona.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-sm flex items-start gap-5 hover:border-red-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-black text-zinc-900">Sede Av. Bolívar</h4>
                <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md">Abierto</span>
              </div>
              <p className="text-zinc-500 text-sm font-medium mb-4 leading-relaxed">
                Nuestra tienda principal. Encuentra el inventario completo, accesorios y atención personalizada.
              </p>
              <a href="#" className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-800 transition-colors">
                <MapPin className="w-4 h-4" /> Ver en el mapa
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-sm flex items-start gap-5 hover:border-red-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-black text-zinc-900">Sede Guacara</h4>
                <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md">Abierto</span>
              </div>
              <p className="text-zinc-500 text-sm font-medium mb-4 leading-relaxed">
                Conoce nuestro nuevo espacio exclusivo en el centro de Guacara con modelos seleccionados.
              </p>
              <a href="#" className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-800 transition-colors">
                <MapPin className="w-4 h-4" /> Ver en el mapa
              </a>
            </div>
          </div>

        </div>

        {/* Info de Envíos - Diseño Minimalista de Texto */}
        <div className="mt-8 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-center">
          <div className="flex items-center gap-3 text-zinc-700">
            <Truck className="w-5 h-5 text-zinc-400" />
            <span className="text-sm">
              <strong className="font-bold text-zinc-900">Envíos Nacionales:</strong> MRW, Zoom y Tealca
            </span>
          </div>
          
          <span className="hidden sm:block text-zinc-300">|</span>
          
          <div className="flex items-center gap-3 text-zinc-700">
            <PackageCheck className="w-5 h-5 text-zinc-400" />
            <span className="text-sm">
              <strong className="font-bold text-zinc-900">Delivery Local:</strong> Entregas el mismo día
            </span>
          </div>
        </div>
      </section>

      {/* =========================================
          8. WHATSAPP
      ========================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-[#25D366] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden shadow-lg gap-8">
          <div className="absolute -left-10 top-0 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#25D366] shadow-md shrink-0">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">¿Necesitas asesoría?</h2>
              <p className="text-green-50 text-sm md:text-base max-w-md font-medium leading-relaxed">
                Escríbenos y te ayudamos a encontrar tu talla ideal, consultar stock y procesar tu compra de inmediato.
              </p>
            </div>
          </div>
          
          <a 
            href="https://wa.me/584220384401" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full md:w-auto bg-white text-[#25D366] font-black py-4 px-8 rounded-xl hover:scale-105 transition-transform flex justify-center items-center gap-2 shadow-md text-base relative z-10"
          >
            Chatear por WhatsApp
          </a>
        </div>
      </section>

    </div>
  )
}