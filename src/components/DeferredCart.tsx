'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'

const CartDrawer = dynamic(() => import('./CartDrawer').then(module => module.CartDrawer), {
  ssr: false,
  loading: () => <div role="status" className="fixed right-0 top-0 z-50 h-full w-full bg-white p-6 shadow-2xl sm:w-100">Cargando carrito...</div>,
})

export function DeferredCart() {
  const isOpen = useCartStore(state => state.isOpen)
  const [hasOpened, setHasOpened] = useState(false)

  // Keep the drawer mounted after first use so delivery choices and the
  // saved order's retry link survive closing it or returning from WhatsApp.
  useEffect(() => useCartStore.subscribe(state => {
    if (state.isOpen) setHasOpened(true)
  }), [])

  return isOpen || hasOpened ? <CartDrawer /> : null
}
