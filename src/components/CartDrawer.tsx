'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { createOrder } from '@/actions/orders'
import { toast } from 'sonner' // <-- NUEVO: Importamos toast

// --- 1. ICONOS SVG ---
const TruckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
const StoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-700"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
const CasheaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
const BinanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>

// --- 2. COMPONENTE SELECT PERSONALIZADO ---
interface Option {
  value: string
  label: string
  icon: React.ReactNode
}

function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  options: Option[], 
  placeholder: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-3 border border-zinc-300 rounded-md bg-white text-sm font-medium flex items-center justify-between focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
      >
        {selectedOption ? (
          <span className="flex items-center gap-2">
            {selectedOption.icon}
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-zinc-500">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className="w-full text-left px-3 py-3 text-sm hover:bg-zinc-50 flex items-center gap-3 transition-colors border-b border-zinc-100 last:border-0"
            >
              {opt.icon}
              <span className="font-medium text-zinc-800">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- 3. COMPONENTE PRINCIPAL DEL CARRITO ---
export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCartStore()

  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
        const data = await response.json()
        if (data && data.promedio) {
          setExchangeRate(data.promedio)
        }
      } catch (error) {
        console.error('Error al obtener la tasa del BCV:', error)
      }
    }
    fetchExchangeRate()
  }, [])

  const subtotal = items.reduce((total, item) => total + (item.base_price * item.quantity), 0)
  const total = items.reduce((total, item) => total + (item.price * item.quantity), 0)
  const savings = subtotal - total
  const totalBs = exchangeRate ? (total * exchangeRate) : 0

  const handleWhatsAppCheckout = async () => {
    if (!deliveryMethod || !paymentMethod) {
      toast.error("Selecciona un método de entrega y pago.")
      return
    }
    
    setIsSubmitting(true)
    
    // Mostramos un mensaje temporal mientras carga
    const loadingToastId = toast.loading("Registrando tu pedido...")

    try {
      const orderResult = await createOrder(items, total, deliveryMethod, paymentMethod)

      if (!orderResult.success) {
        toast.dismiss(loadingToastId)
        toast.error(orderResult.error || "Hubo un problema al procesar el pedido.")
        setIsSubmitting(false)
        return
      }

      toast.dismiss(loadingToastId)
      toast.success("¡Pedido registrado exitosamente!")

      const shortId = orderResult.shortId
      const phoneNumber = "584244601480"
      
      let message = `¡Hola! 👋 Quiero realizar el pedido *#${shortId}*:\n\n`
      
      items.forEach(item => {
        message += `👟 *${item.title}*\n`
        message += `📏 Talla: ${item.size} | 🔢 Cantidad: ${item.quantity}\n`
        message += `💵 Precio unitario: $${item.price}\n`
        message += `---------------------------\n`
      })

      message += `\n📦 *Método de entrega:* ${deliveryMethod}\n`
      message += `💳 *Método de pago:* ${paymentMethod}\n\n`

      message += `📊 *Subtotal:* $${subtotal.toFixed(2)}\n`
      
      if (savings > 0) {
        message += `🎁 *¡Ahorraste: $${savings.toFixed(2)}!*\n\n`
      }
      
      message += `---------------------------\n`
      message += `💰 *TOTAL A PAGAR:* $${total.toFixed(2)}\n`
      if (exchangeRate) {
        message += ` (Ref: Bs. ${totalBs.toFixed(2)})\n\n`
      } else {
        message += `\n\n`
      }
      
      message += `¿Tienen disponibilidad para procesar mi compra?`
      
      const encodedMessage = encodeURIComponent(message)

      // Detectamos si el usuario está navegando desde un dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        // En móviles redirigimos en la misma pestaña con wa.me (evita bloqueos de Safari y abre la app nativa)
        window.location.href = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`
      } else {
        // En PC abrimos WhatsApp Web directamente para evitar que la redirección rompa los emojis
        const desktopUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`
        window.open(desktopUrl, '_blank')
      }
      
      // Limpia el carrito y cierra el panel lateral
      clearCart()
      closeCart()

    } catch (error) {
      console.error("Error al redirigir a WhatsApp:", error)
      toast.dismiss(loadingToastId)
      toast.error("Ocurrió un error inesperado al conectar con el servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deliveryOptions = [
    { value: 'Delivery', label: 'Delivery', icon: <TruckIcon /> },
    { value: 'Pickup en tienda', label: 'Pickup en tienda', icon: <StoreIcon /> }
  ]

  const paymentOptions = [
    { value: 'Pago móvil', label: 'Pago móvil', icon: <PhoneIcon /> },
    { value: '($) Efectivo', label: '($) Efectivo', icon: <CashIcon /> },
    { value: 'Cashea', label: 'Cashea', icon: <CasheaIcon /> },
    { value: 'Binance', label: 'Binance', icon: <BinanceIcon /> }
  ]

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={closeCart}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-100 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between bg-black text-white px-6 h-16 md:h-20 shrink-0">
          <span className="font-bold text-lg tracking-widest">TU CARRITO</span>
          <button onClick={closeCart} className="p-2 -mr-2 text-white hover:text-zinc-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
              <svg className="w-20 h-20 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-medium text-lg">Tu carrito está vacío</p>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 border-b border-zinc-100 pb-6">
                  <div className="relative w-24 h-24 bg-zinc-100 rounded-md overflow-hidden shrink-0">
                    <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-zinc-500 mb-2">Talla: {item.size}</p>
                    <span className="font-black text-sm">${item.price}</span>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center border border-zinc-200 rounded-md overflow-hidden h-8 w-24">
                        <button onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center hover:bg-zinc-100 text-zinc-600">-</button>
                        <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => item.quantity < 9 && updateQuantity(item.id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center hover:bg-zinc-100 text-zinc-600">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-xs font-semibold text-zinc-400 hover:text-red-500 underline">
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-zinc-200 p-6 bg-zinc-50 space-y-5 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">
                  Método de entrega <span className="text-red-500">*</span>
                </label>
                <CustomSelect 
                  value={deliveryMethod}
                  onChange={setDeliveryMethod}
                  options={deliveryOptions}
                  placeholder="Selecciona una opción..."
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">
                  Método de pago <span className="text-red-500">*</span>
                </label>
                <CustomSelect 
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={paymentOptions}
                  placeholder="Selecciona una opción..."
                />
              </div>
            </div>

            <div className="h-px w-full bg-zinc-200 my-4"></div>

            <div className="space-y-2 mb-4">
              {savings > 0 && (
                <div className="flex justify-between items-center text-sm font-bold text-green-600 bg-green-50 p-2 rounded-md">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                    ¡Ahorro total!
                  </span>
                  <span>-${savings.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-end text-sm font-black text-zinc-900 px-1 pt-1">
                <span className="mb-1">TOTAL A PAGAR</span>
                <div className="text-right">
                  <div className="text-2xl leading-none">${total.toFixed(2)}</div>
                  {exchangeRate && (
                    <div className="text-xs text-zinc-500 font-medium mt-1">
                      ~ Bs. {totalBs.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleWhatsAppCheckout} 
              disabled={!deliveryMethod || !paymentMethod || isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 disabled:text-zinc-500 text-white h-14 text-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              {isSubmitting 
                ? 'Procesando pedido...' 
                : (!deliveryMethod || !paymentMethod) ? 'Completa los datos' : 'Pedir por WhatsApp'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}