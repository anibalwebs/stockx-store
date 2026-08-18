import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ message?: string }> 
}) {
  const params = await searchParams;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Acceso Admin</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para gestionar StockX
          </CardDescription>
        </CardHeader>
        <form action={login}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@stockx.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {params?.message && (
              <p className="text-sm font-medium text-red-500">{params.message}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-semibold">Iniciar Sesión</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}