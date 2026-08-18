import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      {/* Menú Lateral (Sidebar) */}
      <aside className="w-64 border-r bg-white p-6">
        <div className="mb-8 font-bold text-xl tracking-tighter">
          STOCKX<span className="text-blue-600">ADMIN</span>
        </div>
        <nav className="flex flex-col space-y-3 text-sm font-medium text-zinc-600">
          <Link
            href="/admin"
            className="rounded-md p-2 transition-colors hover:bg-zinc-100 hover:text-black"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="rounded-md p-2 transition-colors hover:bg-zinc-100 hover:text-black"
          >
            Productos
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-md p-2 transition-colors hover:bg-zinc-100 hover:text-black"
          >
            Categorías & Marcas
          </Link>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}