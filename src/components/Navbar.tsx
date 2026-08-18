'use client'

import { useState } from 'react'
import Link from 'next/link'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  // Función para cerrar el menú en móvil cuando se hace clic en un enlace
  const closeMenu = () => setIsOpen(false)

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black tracking-tighter uppercase" onClick={closeMenu}>
              StockX Store
            </Link>
          </div>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-zinc-700 hover:text-black hover:underline underline-offset-4 transition-all">Inicio</Link>
            <Link href="/categoria/damas" className="text-sm font-medium text-zinc-700 hover:text-black hover:underline underline-offset-4 transition-all">Damas</Link>
            <Link href="/categoria/caballeros" className="text-sm font-medium text-zinc-700 hover:text-black hover:underline underline-offset-4 transition-all">Caballeros</Link>
            <Link href="/contacto" className="text-sm font-medium text-zinc-700 hover:text-black hover:underline underline-offset-4 transition-all">Contacto</Link>
          </div>

          {/* Botón Menú Móvil (Hamburguesa) */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-900 focus:outline-none p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-zinc-100 shadow-lg absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
            <Link href="/" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-bold text-zinc-900 hover:bg-zinc-50">Inicio</Link>
            <Link href="/categoria/damas" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-bold text-zinc-900 hover:bg-zinc-50">Damas</Link>
            <Link href="/categoria/caballeros" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-bold text-zinc-900 hover:bg-zinc-50">Caballeros</Link>
            <Link href="/contacto" onClick={closeMenu} className="block px-3 py-3 rounded-md text-base font-bold text-zinc-900 hover:bg-zinc-50">Contacto</Link>
          </div>
        </div>
      )}
    </nav>
  )
}