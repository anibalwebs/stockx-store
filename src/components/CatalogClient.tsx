'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, 
  Sparkles, Frown, Smartphone, MessageCircle, Truck, PackageCheck, Store, MapPin
} from 'lucide-react'

type Brand = { id: string, name: string }
type Category = { id: string, name: string }
type Product = {
  id: string
  title: string
  slug: string
  base_price: number
  sale_price: number | null
  gender: string
  product_type: string
  product_images: { image_url: string, is_primary: boolean }[]
  brands: { name: string } | null
}

export default function CatalogClient({ 
  initialBrands, 
  initialCategories 
}: { 
  initialBrands: Brand[]
  initialCategories: Category[] 
}) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Estados de productos y paginación
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get('marca') ? [searchParams.get('marca')!] : []
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categoria') ? [searchParams.get('categoria')!] : []
  )
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    searchParams.get('genero') ? [searchParams.get('genero')!] : []
  )
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  useEffect(() => {
  // 1. Foco en buscador
    if (searchParams.get('focus') === 'search' && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    const catParam = searchParams.get('categoria')
    if (catParam) {
      const matchedCat = initialCategories.find(
        c => c.id === catParam || c.name.toLowerCase() === catParam.toLowerCase()
      )
      setSelectedCategories(matchedCat ? [matchedCat.id] : [catParam])
    } else {
      setSelectedCategories([])
    }
    const brandParam = searchParams.get('marca')
    setSelectedBrands(brandParam ? [brandParam] : [])

    // 4. Filtro de Género
    const genderParam = searchParams.get('genero')
    setSelectedGenders(genderParam ? [genderParam] : [])

    setPage(1)
    }, 
    [searchParams, initialCategories])
    
  // Estado UI
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    
    let query = supabase
      .from('products')
      .select(`
        id, title, slug, base_price, sale_price, gender, product_type,
        brands ( name ),
        product_images ( image_url, is_primary )
      `, { count: 'exact' })
      .eq('is_active', true)

    if (searchTerm) query = query.ilike('title', `%${searchTerm}%`)

    if (selectedBrands.length > 0) {
      const validBrands = selectedBrands.filter(b => b !== 'null_brand')
      const hasNullBrand = selectedBrands.includes('null_brand')

      if (validBrands.length > 0 && hasNullBrand) {
        query = query.or(`brand_id.in.(${validBrands.join(',')}),brand_id.is.null`)
      } else if (validBrands.length > 0) {
        query = query.in('brand_id', validBrands)
      } else if (hasNullBrand) {
        query = query.is('brand_id', null)
      }
    }

    if (selectedCategories.length > 0) query = query.in('category_id', selectedCategories)
    if (selectedGenders.length > 0) query = query.in('gender', selectedGenders)
    if (selectedStyles.length > 0) query = query.in('product_type', selectedStyles)
    if (priceRange.min) query = query.gte('base_price', priceRange.min)
    if (priceRange.max) query = query.lte('base_price', priceRange.max)

    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, count, error } = await query

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProducts(data as any)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [page, searchTerm, selectedBrands, selectedCategories, selectedGenders, selectedStyles, priceRange, supabase])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [fetchProducts])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleFilter = (setFilter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setFilter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
    setPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedBrands([])
    setSelectedCategories([])
    setSelectedGenders([])
    setSelectedStyles([])
    setPriceRange({ min: '', max: '' })
    setPage(1)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasActiveFilters = selectedBrands.length > 0 || selectedCategories.length > 0 || selectedGenders.length > 0 || selectedStyles.length > 0 || searchTerm

  const renderFilterSidebar = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-zinc-900">Filtros</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-zinc-500 hover:text-zinc-900 underline">
            Limpiar todo
          </button>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-zinc-900">Precio</h4>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Min" 
            value={priceRange.min}
            onChange={(e) => { 
              const val = e.target.value.slice(0, 4);
              setPriceRange(prev => ({ ...prev, min: val })); 
              setPage(1); 
            }}
            className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none"
          />
          <span className="text-zinc-400">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={priceRange.max}
            onChange={(e) => { 
              const val = e.target.value.slice(0, 4);
              setPriceRange(prev => ({ ...prev, max: val })); 
              setPage(1); 
            }}
            className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-zinc-900">Marca</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {[...initialBrands, { id: 'null_brand', name: 'Sin marca' }].map(brand => (
            <div 
              key={brand.id} 
              onClick={() => toggleFilter(setSelectedBrands, brand.id)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                selectedBrands.includes(brand.id) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300 bg-white'
              }`}>
                {selectedBrands.includes(brand.id) && <Sparkles className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-zinc-600 group-hover:text-zinc-900 select-none">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-zinc-900">Categoría</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {initialCategories.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => toggleFilter(setSelectedCategories, cat.id)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                selectedCategories.includes(cat.id) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300 bg-white'
              }`}>
                {selectedCategories.includes(cat.id) && <Sparkles className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-zinc-600 group-hover:text-zinc-900 select-none">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-zinc-900">Género</h4>
        <div className="flex flex-wrap gap-2">
          {['Caballero', 'Dama', 'Unisex', 'Niños'].map(gender => (
            <button
              key={gender}
              onClick={() => toggleFilter(setSelectedGenders, gender)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenders.includes(gender) 
                  ? 'bg-zinc-900 text-white shadow-md' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-zinc-900">Estilo</h4>
        <div className="flex flex-wrap gap-2">
          {['Deportivo', 'Casual', 'Elegante', 'Botas', 'Sandalias'].map(style => (
            <button
              key={style}
              onClick={() => toggleFilter(setSelectedStyles, style)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedStyles.includes(style) 
                  ? 'bg-zinc-900 text-white shadow-md' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero (Slider Placeholder) */}
      <div className="mb-10 space-y-10">
        
        {/* Tarjeta Oscura de Descuentos */}
        <div className="bg-[#111111] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl flex flex-col items-start text-left">
          {/* Resplandor rojo sutil de fondo (similar a la imagen) */}
          <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-2xl">
            {/* Badge superior */}
            <span className="inline-block px-4 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/40 text-[#FF6B6B] text-xs font-black tracking-widest uppercase mb-6">
              Aprovecha las ofertas
            </span>
            
            {/* Título Principal */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
              DESCUENTOS DE <br />
              <span className="text-[#FF6B6B]">10% Y 15%</span>
            </h1>
            
            {/* Párrafo descriptivo combinado con tu texto */}
            <p className="text-zinc-300 text-sm md:text-base font-medium mb-8 leading-relaxed max-w-xl">
              Comprar ropa, zapatos y accesorios en StockX es más fácil con nuestra página web. Contamos con descuento de 10% en todo nuestro calzado y 15% en toda la ropa, ven a visitarnos y aprovecha cualquiera de los descuentos en cualquiera de nuestras sedes.
            </p>

            {/* Botón de acción */}
            
          </div>
        </div>

        {/* Sección "Descubre tu estilo" */}
        <div className="pt-2 pb-4">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Descubre tu estilo</h2>
          <p className="text-zinc-500 font-medium mt-2">
            Navega por nuestras colecciones principales y encuentra lo que buscas.
          </p>
        </div>
      </div>

      <div className="lg:hidden flex items-center justify-between mb-6">
        <p className="text-sm font-medium text-zinc-500">{totalCount} resultados</p>
        <button 
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center gap-2.5 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-zinc-800 hover:shadow-lg transition-all active:scale-95"
        >
          <SlidersHorizontal className="w-4 h-4" /> 
          Filtros
          {/* Indicador visual si hay filtros aplicados */}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          )}
        </button>
      </div>

      {/* Catálogo Main */}
      <div className="flex gap-8 items-start mb-16">
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          {renderFilterSidebar()}
        </aside>

        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
            <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto">
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                className="absolute top-4 right-4 p-2 bg-zinc-100 rounded-full text-zinc-500 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
              {renderFilterSidebar()}
              <div className="mt-8">
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full bg-zinc-900 text-white font-bold h-12 rounded-xl shadow-lg"
                >
                  Ver Resultados ({totalCount})
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="relative w-full mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Buscar sneakers, ropa, marcas..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full h-14 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none text-lg transition-all"
            />
          </div>

          <div className="hidden lg:flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-zinc-900">Todos los productos</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-500">{totalCount} resultados</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-zinc-200 aspect-square rounded-2xl mb-3"></div>
                  <div className="h-4 bg-zinc-200 rounded w-1/3 mb-2"></div>
                  <div className="h-5 bg-zinc-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map(product => {
                  const mainImg = product.product_images?.find(img => img.is_primary)?.image_url 
                    || product.product_images?.[0]?.image_url 
                    || '/placeholder.png'

                  return (
                    <Link key={product.id} href={`/product/${product.slug}`} className="group block bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-zinc-100 hover:shadow-xl hover:border-zinc-200 transition-all duration-300">
                      <div className="aspect-square relative rounded-2xl overflow-hidden bg-zinc-50 mb-4">
                        <Image 
                          src={mainImg} 
                          alt={product.title} 
                          fill 
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {product.sale_price && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-md z-10">
                            Oferta
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1 truncate">
                        {product.brands?.name || 'Genérico'} • {product.gender}
                      </p>
                      <h4 className="font-bold text-sm text-zinc-900 leading-tight mb-2 truncate">{product.title}</h4>
                      
                      <div className="flex items-center gap-2">
                        {product.sale_price ? (
                          <>
                            <span className="font-black text-lg text-red-600">${product.sale_price}</span>
                            <span className="text-xs text-zinc-400 line-through font-medium">${product.base_price}</span>
                          </>
                        ) : (
                          <span className="font-black text-lg text-zinc-900">${product.base_price}</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2 border-t border-zinc-100 pt-8">
                  <button 
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-600 disabled:opacity-30 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all cursor-pointer ${
                          page === i + 1 ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-600 disabled:opacity-30 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-3xl border border-zinc-100 shadow-sm mt-8">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <Frown className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">No encontramos resultados</h3>
              <p className="text-zinc-500 max-w-sm mb-6">No hay productos que coincidan con tus filtros actuales. Intenta buscar de otra manera.</p>
              <button onClick={clearFilters} className="bg-zinc-900 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-zinc-800 transition-colors">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          SECCIONES INFERIORES (Estilo page.tsx)
      ========================================= */}
      {/* =========================================
          SECCIONES INFERIORES (Estilo page.tsx)
      ========================================= */}
      <div className="w-full pt-10 mt-10 border-t border-zinc-200">
        
        {/* BANNER DE CASHEA */}
        <div className="mb-10">
          <div className="bg-[#FFDF00] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-yellow-500/10 text-black relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/40 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone className="w-7 h-7 text-black" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
                  Paga con Cashea 
                  <span className="bg-black text-white text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider font-bold">EN CUOTAS</span>
                </h3>
                <p className="text-zinc-900 text-sm md:text-base mt-2 font-medium leading-tight max-w-lg">
                  Puedes hacer tu compra con nosotros desde Cashea sin tener que salir de casa, dependiendo del nivel que seas en Cashea podrás pagar en más cuotas o con una inicial menor.
                </p>
              </div>
            </div>
            
            <Link href="/informacion-pagos" className="w-full md:w-auto bg-black text-white px-8 py-3.5 rounded-xl font-bold text-sm text-center hover:bg-zinc-800 transition-colors shadow-md relative z-10">
              Ver cómo funciona
            </Link>
          </div>
        </div>

        {/* UBICACIONES Y ENVÍOS */}
        <div className="mb-10">
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
                  <h4 className="text-lg font-black text-zinc-900">Av. Bolívar</h4>
                  <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md">8:00AM A 7:00PM</span>
                </div>
                <p className="text-zinc-500 text-sm font-medium mb-4 leading-relaxed">
                  Nuestra tienda ubicada en Valencia, en la Av Bolivar Norte al frente del colegio Lourdes, ven a visitarnos.
                </p>
                <a href="https://maps.app.goo.gl/SSF7BfqHpHTxb6CW8" className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-800 transition-colors">
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
                  <h4 className="text-lg font-black text-zinc-900">Guacara</h4>
                  <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md">9:00AM A 8:00PM</span>
                </div>
                <p className="text-zinc-500 text-sm font-medium mb-4 leading-relaxed">
                  Conoce nuestro nuevo espacio exclusivo en el centro de Guacara con modelos seleccionados.
                </p>
                <a href="https://maps.app.goo.gl/vpZsyTWwkVZzXSQ5A" className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-800 transition-colors">
                  <MapPin className="w-4 h-4" /> Ver en el mapa
                </a>
              </div>
            </div>
          </div>

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
        </div>

        {/* WHATSAPP */}
        <div>
          <div className="bg-[#25D366] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden shadow-lg gap-8">
            <div className="absolute -left-10 top-0 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#25D366] shadow-md shrink-0">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">¿Ayuda con algo?</h2>
                <p className="text-green-50 text-sm md:text-base max-w-md font-medium leading-relaxed">
                  Escríbenos y te ayudamos a encontrar tu talla ideal o color, consultar stock y procesar tu compra de inmediato.
                </p>
              </div>
            </div>
            
            <a 
              href="https://wa.me/584244601480" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full md:w-auto bg-white text-[#25D366] font-black py-4 px-8 rounded-xl hover:scale-105 transition-transform flex justify-center items-center gap-2 shadow-md text-base relative z-10"
            >
              Chatear por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}