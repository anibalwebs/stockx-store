'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore' // Importamos Zustand

// Definimos la forma de los datos que recibiremos
type ProductClientProps = {
  product: {
    title: string
    base_price: number
    sale_price: number | null
    description: string
    gender: string
    product_type: string
    brands: { name: string } | null
    product_images: { image_url: string }[]
    product_variants: { size: string }[]
  }
}

export default function ProductClient({ product }: ProductClientProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [sizeError, setSizeError] = useState<boolean>(false)

  // Extraemos la función para agregar productos de Zustand
  const addItem = useCartStore((state) => state.addItem)

  // Configuración del máximo permitido por compra
  const MAX_QUANTITY = 9 

  // Extraemos la imagen principal
  const mainImage = product.product_images?.[0]?.image_url || '/placeholder.png'

  // Función para manejar la selección de talla y limpiar el error si existía
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    setSizeError(false) 
  }

  // Funciones para sumar y restar cantidad
  const increment = () => setQuantity(prev => prev < MAX_QUANTITY ? prev + 1 : prev)
  const decrement = () => setQuantity(prev => prev > 1 ? prev - 1 : prev)

  // Función para agregar al carrito conectada a Zustand
  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true) 
      return
    }

    // Enviamos el producto a la memoria del carrito
    addItem({
      id: `${product.title}-${selectedSize}`, // Unimos título y talla por si compran el mismo en diferentes tamaños
      title: product.title,
      size: selectedSize,
      price: product.sale_price || product.base_price,
      base_price: product.base_price,
      quantity: quantity,
      image: mainImage
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Columna Izquierda: Imagen */}
        <div className="aspect-square relative bg-zinc-100 rounded-2xl overflow-hidden">
          <Image 
            src={mainImage}
            alt={product.title}
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Columna Derecha: Detalles del Producto */}
        <div className="space-y-8">
          <div>
            <p className="text-sm text-zinc-500 font-semibold tracking-widest uppercase mb-2">
              {product.brands?.name} • {product.gender}
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-4">
              {product.sale_price ? (
                <>
                  <span className="text-3xl font-bold text-red-600">${product.sale_price}</span>
                  <span className="text-xl text-zinc-400 line-through">${product.base_price}</span>
                </>
              ) : (
                <span className="text-3xl font-bold">${product.base_price}</span>
              )}
            </div>
          </div>

          {/* Selector de Tallas */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Selecciona tu talla</h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.product_variants.length > 0 ? (
                [...product.product_variants]
                  .sort((a, b) => Number(a.size) - Number(b.size))
                  .map((variant) => (
                    <button
                      key={variant.size}
                      onClick={() => handleSizeSelect(variant.size)}
                      className={`py-3 border rounded-md text-center font-medium transition-all ${
                        selectedSize === variant.size 
                          ? 'bg-black text-white border-black shadow-md' 
                          : 'bg-white text-zinc-900 border-zinc-200 hover:border-black'
                      }`}
                    >
                      {variant.size}
                    </button>
                  ))
              ) : (
                <p className="text-zinc-500 text-sm col-span-full">No hay tallas registradas para este producto.</p>
              )}
            </div>
            
            {/* Mensaje de error HTML (solo aparece si sizeError es true) */}
            {sizeError && (
              <p className="text-red-500 text-sm font-semibold animate-pulse mt-2">
                ⚠️ Debes seleccionar una talla antes de agregar al carrito.
              </p>
            )}
          </div>

          {/* Selector de Cantidad */}
          <div className="space-y-4 pt-4">
             <h3 className="font-bold text-lg">Cantidad</h3>
             <div className="flex items-center w-32 border border-zinc-200 rounded-md overflow-hidden bg-white">
               <button 
                 onClick={decrement} 
                 className="w-10 h-10 flex items-center justify-center text-xl text-zinc-600 hover:bg-zinc-100 hover:text-black transition-colors"
               >
                 -
               </button>
               <span className="flex-1 text-center font-medium select-none">{quantity}</span>
               <button 
                 onClick={increment} 
                 className="w-10 h-10 flex items-center justify-center text-xl text-zinc-600 hover:bg-zinc-100 hover:text-black transition-colors"
               >
                 +
               </button>
             </div>
          </div>

          {/* Botón Principal (Agregar al Carrito) */}
          <div className="space-y-4 pt-6 border-t border-zinc-200">
            <Button 
              size="lg" 
              className="w-full text-lg h-14 bg-black hover:bg-zinc-800 text-white font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              onClick={handleAddToCart}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Agregar al Carrito
            </Button>
            <p className="text-xs text-center text-zinc-500">
              Podrás enviar tu pedido directamente por WhatsApp más adelante.
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-4 pt-6">
            <h3 className="font-bold text-lg">Descripción</h3>
            <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
              {product.description || "Este producto no tiene descripción detallada."}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}