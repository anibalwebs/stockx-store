'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, X, LayoutDashboard, Package, Tags, 
  ShoppingCart, Users, Ticket, Settings, ArrowLeft, LogOut
} from 'lucide-react'
import { logout } from '@/actions/auth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()

  const isLoginPage = pathname?.includes('/login')

  // Si es la página de login, devolvemos el contenido limpio (el botón se movió a la página)
  if (isLoginPage) {
    return <>{children}</>
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  const navItems = [
    {
      title: 'PRINCIPAL',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, disabled: false },
        { name: 'Productos', href: '/admin/products', icon: Package, disabled: false },
        { name: 'Categorías & Marcas', href: '/admin/categories', icon: Tags, disabled: false },
      ]
    },
    {
      title: 'GESTIÓN',
      items: [
        { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart, disabled: false },
        { name: 'Clientes', href: '#', icon: Users, disabled: true },
        { name: 'Promociones', href: '#', icon: Ticket, disabled: true },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { name: 'Configuración', href: '#', icon: Settings, disabled: true },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      
      {/* Cabecera Móvil */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-zinc-200 p-4 sticky top-0 z-40">
        <div className="font-bold text-xl tracking-tighter">
          STOCKX<span className="text-red-600">ADMIN</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-zinc-600 hover:text-black transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay oscuro para móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Menú Lateral (Sidebar) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-dvh w-72 bg-white border-r border-zinc-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-zinc-100 shrink-0">
          <div className="font-black text-xl tracking-tighter">
            STOCKX<span className="text-red-600">ADMIN</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {navItems.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.disabled ? '#' : item.href}
                      onClick={() => !item.disabled && setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${item.disabled 
                          ? 'opacity-50 cursor-not-allowed text-zinc-400' 
                          : isActive 
                            ? 'bg-black text-white shadow-md' 
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
                        }
                      `}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      {item.name}
                      {item.disabled && (
                        <span className="ml-auto text-[10px] font-bold bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full">
                          PRONTO
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Zona Inferior */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 mt-auto shrink-0 flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-600 hover:bg-white hover:text-black hover:shadow-sm border border-transparent hover:border-zinc-200 transition-all"
          >
            <ArrowLeft size={18} />
            Volver a la Tienda
          </Link>
          
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all disabled:opacity-50"
          >
            <LogOut size={18} />
            {isPending ? 'Cerrando...' : 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-[100vw] md:max-w-none overflow-x-hidden flex flex-col h-[calc(100vh-64px)] md:h-screen">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}