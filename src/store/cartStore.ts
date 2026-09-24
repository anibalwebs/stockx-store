import { create } from 'zustand'

export type CartItem = {
  id: string 
  title: string
  size: string
  price: number 
  base_price: number 
  quantity: number
  image: string
}

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void // <-- Nueva función
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  
  addItem: (item) => set((state) => {
    const existingItem = state.items.find((i) => i.id === item.id)
    if (existingItem) {
      return {
        items: state.items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i),
        isOpen: true 
      }
    }
    return { items: [...state.items, item], isOpen: true }
  }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((i) => i.id !== id)
  })),

  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map((i) => i.id === id ? { ...i, quantity } : i)
  })),

  // Limpia el arreglo de items dejándolo vacío
  clearCart: () => set({ items: [] }) 
}))