import { Navbar } from "@/components/Navbar";
import Footer from '@/components/Footer'

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-white"> 
      <Navbar />
      
      {/* flex-grow permite que el contenido principal ocupe el espacio disponible */}
      <main className="grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}