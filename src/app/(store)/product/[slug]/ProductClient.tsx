'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
// Agregamos ArrowLeft a tu lista de íconos
import { ShoppingBag, ChevronDown, Flame, CreditCard, Sparkles, MessageCircleQuestion, ArrowLeft } from 'lucide-react'

type ProductSummary = {
  title: string
  slug: string
  base_price: number
  sale_price: number | null
  gender?: string
  brands: { name: string } | null
  product_images: { image_url: string; is_primary: boolean }[]
}

type ProductClientProps = {
  product: {
    id: string
    title: string
    slug: string
    base_price: number
    sale_price: number | null
    description: string
    gender: string
    product_type: string
    brands: { name: string } | null
    product_images: { image_url: string; is_primary: boolean }[]
    product_variants: { size: string }[]
  }
  relatedProducts: ProductSummary[]
  saleProducts: ProductSummary[]
}

export default function ProductClient({ product, relatedProducts, saleProducts }: ProductClientProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [sizeError, setSizeError] = useState<boolean>(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Estados para componentes interactivos
  const [isCasheaExpanded, setIsCasheaExpanded] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const addItem = useCartStore((state) => state.addItem)
  const MAX_QUANTITY = 9 

  const sortedImages = product.product_images?.length > 0 
    ? [...product.product_images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    : [{ image_url: '/placeholder.png', is_primary: true }]

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    setSizeError(false) 
  }

  const increment = () => setQuantity(prev => prev < MAX_QUANTITY ? prev + 1 : prev)
  const decrement = () => setQuantity(prev => prev > 1 ? prev - 1 : prev)

  const currentPrice = product.sale_price || product.base_price
  const casheaInitial = currentPrice / 2
  const casheaInstallment = casheaInitial / 3

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true) 
      return
    }

    addItem({
      id: `${product.title}-${selectedSize}`,
      title: product.title,
      size: selectedSize,
      price: currentPrice,
      base_price: product.base_price,
      quantity: quantity,
      image: sortedImages[0].image_url
    })
  }

  const faqs = [
    {
      question: "¿Realizan envíos a nivel nacional?",
      answer: "Sí, realizamos envíos a todo el país cobro en destino a través de las principales agencias de encomienda (MRW, Zoom, Tealca). Los tiempos de entrega varían entre 2 a 5 días hábiles dependiendo de la zona."
    },
    {
      question: "¿Cuáles son los métodos de pago aceptados?",
      answer: "Aceptamos pago móvil, transferencias nacionales, Zelle, divisas en efectivo (solo en tienda física) y financiamiento en cuotas a través de la aplicación Cashea."
    },
    {
      question: "¿Cuál es la política de cambios y devoluciones?",
      answer: "Tienes hasta 7 días continuos después de recibir tu compra para solicitar un cambio por talla o defecto de fábrica. El producto debe estar en perfectas condiciones, sin uso y con sus etiquetas originales."
    },
    {
      question: "¿Cómo funciona el pago con Cashea?",
      answer: "Con Cashea pagas solo el 50% del producto hoy como inicial y te llevas tu compra de inmediato. El 50% restante lo pagas en 3 cuotas iguales sin interés cada 14 días a través de la app."
    }
  ]

  const ProductCard = ({ item }: { item: ProductSummary }) => {
    const mainImg = item.product_images?.find(img => img.is_primary)?.image_url 
      || item.product_images?.[0]?.image_url 
      || '/placeholder.png'

    return (
      <Link href={`/product/${item.slug}`} className="group block">
        <div className="aspect-square relative rounded-2xl overflow-hidden bg-zinc-100 mb-3">
          <Image 
            src={mainImg} 
            alt={item.title} 
            fill 
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {item.sale_price && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-md z-10">
              <Sparkles size={10} /> Oferta
            </span>
          )}
        </div>
        
        {/* Categoría/Género en Rojo */}
        <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">{item.gender || 'UNISEX'}</p>
        
        <h4 className="font-bold text-sm text-zinc-900 leading-tight mb-1 truncate">{item.title}</h4>
        
        {/* Cartel de Ahorro si hay oferta */}
        {item.sale_price && (
          <div className="mb-1.5 inline-block bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold text-red-500">
            Ahorras ${(item.base_price - item.sale_price).toFixed(0)}
          </div>
        )}

        <div className="flex items-center gap-2">
          {item.sale_price ? (
            <>
              <span className="font-bold text-zinc-900">${item.sale_price}</span>
              <span className="text-xs text-zinc-400 line-through">${item.base_price}</span>
            </>
          ) : (
            <span className="font-bold text-zinc-900">${item.base_price}</span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24">
      {/* SECCIÓN PRINCIPAL DEL PRODUCTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        
        {/* Columna Izquierda: Galería de Imágenes */}
        <div className="space-y-4">
          
          {/* NUEVO: Enlace de Volver al Catálogo */}
          <Link 
            href="/catalogo" 
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors w-fit mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>

          <div className="aspect-square relative bg-zinc-50 rounded-3xl overflow-hidden shadow-sm border border-zinc-100">
            <Image 
              src={sortedImages[currentImageIndex].image_url}
              alt={product.title}
              fill
              className="object-cover object-center transition-opacity duration-300"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          
          {sortedImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
              {sortedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 snap-start transition-all border-2 ${
                    currentImageIndex === idx ? 'border-zinc-900 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image 
                    src={img.image_url} 
                    alt={`Vista ${idx + 1}`} 
                    fill 
                    className="object-cover bg-zinc-50"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
          
        </div>

        {/* Columna Derecha: Detalles del Producto */}
        <div className="space-y-8">
          <div>
            <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
              {product.brands?.name} • {product.gender}
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4 leading-tight">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-4">
              {product.sale_price ? (
                <>
                  <span className="text-3xl md:text-4xl font-black text-red-600">${product.sale_price}</span>
                  <span className="text-xl text-zinc-400 line-through font-medium">${product.base_price}</span>
                </>
              ) : (
                <span className="text-3xl md:text-4xl font-black text-red-600">${product.base_price}</span>
              )}
            </div>
          </div>

          {/* Tarjeta Expandible de Cashea (Estilo Amarillo/Negro) */}
          <div className="border border-[#FFDE00]/60 bg-[#FFDE00]/10 rounded-2xl overflow-hidden transition-all duration-300">
            <button 
              onClick={() => setIsCasheaExpanded(!isCasheaExpanded)} 
              className="w-full flex items-center justify-between p-4 hover:bg-[#FFDE00]/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-[#FFDE00] p-1.5 rounded-lg">
                  <CreditCard className="text-zinc-900 w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-zinc-800">
                  Paga con <span className="font-black text-zinc-900 tracking-tight">cashea</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                <span>Inicial ${casheaInitial.toFixed(2)}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isCasheaExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            <div className={`grid transition-all duration-300 ease-in-out ${isCasheaExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="p-4 pt-0 text-sm text-zinc-700 space-y-3">
                  <div className="h-px w-full bg-[#FFDE00]/40 mb-3" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Cuota Inicial (50%)</span> 
                    <span className="font-black text-zinc-900">${casheaInitial.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">3 Cuotas sin interés</span> 
                    <span className="font-black text-zinc-900">${casheaInstallment.toFixed(2)} <span className="text-xs text-zinc-500 font-medium">/ cada una</span></span>
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-1 leading-tight">
                    *Monto aproximado. Sujeto a la línea de crédito disponible en tu app de Cashea.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Tallas */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wide">Selecciona tu talla</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.product_variants.length > 0 ? (
                [...product.product_variants]
                  .sort((a, b) => Number(a.size) - Number(b.size))
                  .map((variant) => (
                    <button
                      key={variant.size}
                      onClick={() => handleSizeSelect(variant.size)}
                      className={`h-12 border rounded-xl text-center font-bold text-sm transition-all ${
                        selectedSize === variant.size 
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-md scale-[1.02]' 
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                      }`}
                    >
                      {variant.size}
                    </button>
                  ))
              ) : (
                <p className="text-zinc-500 text-sm col-span-full">No hay tallas registradas.</p>
              )}
            </div>
            
            {sizeError && (
              <p className="text-red-500 text-xs font-bold animate-pulse mt-2 bg-red-50 p-2 rounded-lg inline-block">
                Selecciona una talla para continuar.
              </p>
            )}
          </div>

          {/* Selector de Cantidad */}
          <div className="space-y-4 pt-2">
             <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wide">Cantidad</h3>
             <div className="flex items-center w-36 h-12 border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
               <button onClick={decrement} className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors font-medium">-</button>
               <span className="flex-1 text-center font-black text-zinc-900 select-none">{quantity}</span>
               <button onClick={increment} className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors font-medium">+</button>
             </div>
          </div>

          {/* Botón Agregar */}
          <div className="pt-6">
            <Button 
              size="lg" 
              className="w-full text-base h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-all shadow-xl shadow-zinc-900/20 rounded-2xl flex items-center justify-center gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-5 h-5" />
              Agregar al Carrito
            </Button>
          </div>
          

          
        
        </div>
      </div>
      <div className="pt-10 border-t border-zinc-100">
        <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wide mb-4">Descripción del producto</h3>
        <div className="max-w-9xl">
          <p className="text-zinc-500 leading-relaxed whitespace-pre-line text-sm font-medium">
            {product.description || "Este producto no tiene descripción detallada."}
          </p>
        </div>
      </div>
      

      {/* SECCIÓN: PRODUCTOS DE LA MISMA MARCA */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-zinc-100">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 mb-6">También te puede gustar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(item => (
              <ProductCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN: PREGUNTAS FRECUENTES (FAQ) */}
      <section className="pt-10 border-t border-zinc-100">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <MessageCircleQuestion className="w-6 h-6 text-zinc-900" />
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 text-center">
              Preguntas Frecuentes
            </h2>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border border-zinc-200 rounded-2xl overflow-hidden transition-colors hover:border-zinc-300 bg-white"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className="font-semibold text-zinc-900 text-sm md:text-base pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-300 ${
                      openFaqIndex === index ? 'rotate-180 text-zinc-900' : ''
                    }`} 
                  />
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaqIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="p-5 pt-0 text-sm text-zinc-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN: OFERTAS (CASHEA) */}
      {saleProducts.length > 0 && (
        <section className="pt-10 border-t border-zinc-100 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-red-500 fill-red-500/20" /> 
                Ofertas Especiales
              </h2>
              <div className="mt-2 flex items-center gap-1.5 bg-[#FFDE00]/20 w-fit px-3 py-1.5 rounded-full border border-[#FFDE00]/50">
                <span className="text-xs font-medium text-zinc-700">Llévalos con</span>
                <span className="text-xs font-black text-zinc-900 tracking-tight">cashea</span>
                <span className="text-xs font-medium text-zinc-700">hoy mismo</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {saleProducts.map(item => (
              <ProductCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}