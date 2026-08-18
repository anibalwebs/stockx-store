import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
      <p className="mt-2 text-zinc-500">
        Bienvenido, {user.email}. Has iniciado sesión correctamente.
      </p>
    </div>
  )
}