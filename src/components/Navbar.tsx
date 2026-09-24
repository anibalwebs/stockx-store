'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { CartDrawer } from './CartDrawer'

// Estructura de datos escalable para nuestras categorías
type Submenu = { name: string; href: string }
type Category = {
  name: string
  href: string
  isPromo?: boolean
  submenus?: Submenu[]
}

const NAV_CATEGORIES: Category[] = [
  {
    name: 'Calzado',
    href: '/categoria/calzado',
    submenus: [
      { name: 'Todo', href: '/categoria/calzado' },
      { name: 'Dama', href: '/categoria/calzado/dama' },
      { name: 'Caballeros', href: '/categoria/calzado/caballeros' },
      { name: 'Niños', href: '/categoria/calzado/ninos' },
    ]
  },
  {
    name: 'Ropa',
    href: '/categoria/ropa',
    submenus: [
      { name: 'Todo', href: '/categoria/ropa' },
      { name: 'Dama', href: '/categoria/ropa/dama' },
      { name: 'Caballeros', href: '/categoria/ropa/caballeros' },
      { name: 'Niños', href: '/categoria/ropa/ninos' },
    ]
  },
  {
    name: 'Accesorios',
    href: '/categoria/accesorios',
    submenus: [
      { name: 'Todo', href: '/categoria/accesorios' },
      { name: 'Dama', href: '/categoria/accesorios/dama' },
      { name: 'Caballeros', href: '/categoria/accesorios/caballeros' },
      { name: 'Niños', href: '/categoria/accesorios/ninos' },
    ]
  },
  {
    name: 'Promoción',
    href: '/categoria/promocion',
    isPromo: true, 
  }
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<Category | null>(null)

  // Extraemos estado y acciones de Zustand
  const { openCart, items } = useCartStore()
  
  // Calculamos cuántos productos hay en total
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  const closeMenu = () => {
    setIsMobileMenuOpen(false)
    setActiveSubmenu(null)
  }

  const openSubmenu = (category: Category) => {
    setActiveSubmenu(category)
  }

  const goBackToMainMenu = () => {
    setActiveSubmenu(null)
  }

  return (
    <>
      {/* BARRA DE NAVEGACIÓN PRINCIPAL */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            
            {/* LADO IZQUIERDO: Menú Móvil + Logo */}
            <div className="flex flex-1 items-center justify-start gap-2">
              
              {/* Botón Menú Móvil (Hamburguesa) */}
              <div className="flex items-center md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-zinc-900 focus:outline-none p-2 -ml-2"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Logo */}
              <Link href="/" className="flex items-center" onClick={closeMenu}>
                <Image 
                  src="/logo.png" 
                  alt="StockX Store Logo" 
                  width={140} 
                  height={45} 
                  className="object-contain h-8 md:h-10 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* CENTRO: Menú Desktop */}
            <div className="hidden md:flex justify-center items-center space-x-8">
              {NAV_CATEGORIES.map((category) => (
                <div key={category.name} className="relative group py-8">
                  <Link 
                    href={category.href} 
                    className={`text-sm font-bold flex items-center gap-1 transition-colors ${
                      category.isPromo ? 'text-red-600 hover:text-red-700' : 'text-zinc-800 hover:text-blue-600'
                    }`}
                  >
                    {category.name}
                    {category.submenus && (
                      <svg className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>

                  {category.submenus && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-50 z-50">
                      <ul className="py-2">
                        {category.submenus.map((sub) => (
                          <li key={sub.name}>
                            <Link 
                              href={sub.href}
                              className="block px-6 py-2.5 text-sm font-medium text-zinc-600 hover:text-black hover:bg-zinc-50"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* LADO DERECHO: Iconos */}
            <div className="flex flex-1 items-center justify-end gap-4">
              <button className="text-zinc-900 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
              <button className="text-zinc-900 p-1 hidden md:block">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
              
              {/* Botón del carrito conectado a Zustand */}
              <button onClick={openCart} className="text-zinc-900 p-1 relative hover:text-zinc-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* OVERLAY DEL MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={closeMenu} />
          
          <div className="relative flex w-full max-w-sm flex-col bg-white h-full overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-300">
            
            <div className="flex items-center justify-between bg-black text-white px-4 h-16 shrink-0">
              <button onClick={closeMenu} className="p-2 -ml-2 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Image 
                src="/logo.png" 
                alt="StockX Logo" 
                width={100} 
                height={30} 
                className="object-contain h-6 brightness-0 invert" 
              />
              <div className="w-10"></div>
            </div>

            <div className="flex-1 py-4">
              
              {!activeSubmenu ? (
                <div className="flex flex-col">
                  <ul className="space-y-1">
                    {NAV_CATEGORIES.map((category) => (
                      <li key={category.name}>
                        {category.submenus ? (
                          <button 
                            onClick={() => openSubmenu(category)}
                            className={`w-full flex items-center justify-between px-6 py-4 text-left font-bold border-b border-zinc-100 ${
                              category.isPromo ? 'text-red-600' : 'text-zinc-900'
                            }`}
                          >
                            {category.name}
                            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <Link 
                            href={category.href}
                            onClick={closeMenu}
                            className={`w-full flex items-center justify-between px-6 py-4 text-left font-bold border-b border-zinc-100 ${
                              category.isPromo ? 'text-red-600' : 'text-zinc-900'
                            }`}
                          >
                            {category.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 px-6 pb-8 space-y-8">
                    <div>
                      <h4 className="text-xs font-black text-zinc-500 mb-4 tracking-widest">NECESITAS AYUDA?</h4>
                      <div className="space-y-4">
                        <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          Whatsapp:
                        </a>
                        <a href="mailto:ventas@tutienda.com" className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          Ventas@tutienda.com
                        </a>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-zinc-500 mb-4 tracking-widest">SÍGUENOS</h4>
                      <div className="space-y-4">
                        <a href="#" className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600">f</div>
                          Facebook
                        </a>
                        <a href="#" className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600">ig</div>
                          Instagram
                        </a>
                        <a href="#" className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600">yt</div>
                          YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              ) : (

                <div className="flex flex-col animate-in slide-in-from-right-8 duration-200">
                  <button 
                    onClick={goBackToMainMenu}
                    className="flex items-center gap-2 px-6 py-4 text-sm font-bold border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    Atrás
                  </button>
                  
                  <div className="px-6 py-6 font-black text-lg tracking-tight border-b border-zinc-100">
                    {activeSubmenu.name}
                  </div>

                  {activeSubmenu.submenus && (
                    <ul className="flex flex-col">
                      {activeSubmenu.submenus.map((sub) => (
                        <li key={sub.name}>
                          <Link 
                            href={sub.href}
                            onClick={closeMenu}
                            className="flex items-center justify-between px-6 py-4 text-sm font-medium text-zinc-700 border-b border-zinc-100 hover:bg-zinc-50"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* RENDERIZAMOS EL CARRITO AQUÍ PARA QUE ESTÉ DISPONIBLE EN TODA LA TIENDA */}
      <CartDrawer />
    </>
  )
}