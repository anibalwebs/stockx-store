'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

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

  // Extraemos la imagen principal
  const mainImage = product.product_images?.[0]?.image_url || '/placeholder.png'

  // Función para redirigir a WhatsApp
  const handleWhatsAppOrder = () => {
    if (!selectedSize) {
      alert("Por favor, selecciona una talla primero.")
      return
    }

    // TU NÚMERO DE WHATSAPP AQUÍ (Con código de país, sin el símbolo +)
    // Ejemplo: 584141234567 (Venezuela) o 573001234567 (Colombia)
    const phoneNumber = "584120000000" 
    
    const priceToPay = product.sale_price || product.base_price
    
    // El mensaje pre-armado
    const message = `¡Hola! Me interesa comprar este producto:\n\n`
      + `👟 *${product.title}*\n`
      + `📏 *Talla:* ${selectedSize}\n`
      + `💵 *Precio:* $${priceToPay}\n\n`
      + `¿Tienen disponibilidad para envío/entrega?`

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
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

          <div className="space-y-4">
            <h3 className="font-bold text-lg">Selecciona tu talla</h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.product_variants.length > 0 ? (
                // Ordenar las tallas para que no salgan desordenadas
                [...product.product_variants]
                  .sort((a, b) => Number(a.size) - Number(b.size))
                  .map((variant) => (
                    <button
                      key={variant.size}
                      onClick={() => setSelectedSize(variant.size)}
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
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-200">
            <Button 
              size="lg" 
              className="w-full text-lg h-14 bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={handleWhatsAppOrder}
            >
              Pedir por WhatsApp
            </Button>
            <p className="text-xs text-center text-zinc-500">
              Consultarás la disponibilidad directamente con un asesor.
            </p>
          </div>

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