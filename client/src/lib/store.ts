import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  avatar?: string;
  permissions?: {
    canManageInventory: boolean;
    canManageSales: boolean;
    canViewAnalytics: boolean;
    canManageStaff: boolean;
    canManageCustomers: boolean;
    canViewFinancials: boolean;
    canExportData: boolean;
  };
}

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  purchasePrice: number;
  quantity: number;
  discount: number;
  gstRate: number;
  unit: string;
}

interface ActivityItem {
  id?: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  amount?: number;
}

interface SyncItem {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: any;
}

interface VyaparState {
  token: string | null;
  user: User | null;
  emergencyMode: boolean;
  isOffline: boolean;
  syncQueue: SyncItem[];
  cart: CartItem[];
  timeline: ActivityItem[];
  notifications: string[];

  // Actions
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;
  setEmergencyMode: (val: boolean) => void;
  setOfflineStatus: (val: boolean) => void;
  addToSyncQueue: (item: Omit<SyncItem, 'id'>) => void;
  clearSyncQueue: () => void;
  popSyncQueue: () => void;

  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  updateCartDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;

  // Timeline & Notification actions
  addActivity: (activity: ActivityItem) => void;
  setTimeline: (activities: ActivityItem[]) => void;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}

export const useVyaparStore = create<VyaparState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      emergencyMode: false,
      isOffline: false,
      syncQueue: [],
      cart: [],
      timeline: [],
      notifications: [],

      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null, cart: [], syncQueue: [] }),
      setEmergencyMode: (val) => set({ emergencyMode: val }),
      setOfflineStatus: (val) => set({ isOffline: val }),
      addToSyncQueue: (item) => set((state) => ({
        syncQueue: [...state.syncQueue, { ...item, id: Math.random().toString(36).substr(2, 9) }]
      })),
      clearSyncQueue: () => set({ syncQueue: [] }),
      popSyncQueue: () => set((state) => ({ syncQueue: state.syncQueue.slice(1) })),

      addToCart: (item) => set((state) => {
        const existing = state.cart.find((c) => c.productId === item.productId);
        if (existing) {
          return {
            cart: state.cart.map((c) =>
              c.productId === item.productId
                ? { ...c, quantity: c.quantity + item.quantity }
                : c
            )
          };
        }
        return { cart: [...state.cart, item] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((c) => c.productId !== productId)
      })),
      updateCartQty: (productId, qty) => set((state) => ({
        cart: state.cart.map((c) => c.productId === productId ? { ...c, quantity: Math.max(1, qty) } : c)
      })),
      updateCartDiscount: (productId, discount) => set((state) => ({
        cart: state.cart.map((c) => c.productId === productId ? { ...c, discount: Math.min(100, Math.max(0, discount)) } : c)
      })),
      clearCart: () => set({ cart: [] }),

      addActivity: (activity) => set((state) => ({
        timeline: [activity, ...state.timeline].slice(0, 100) // limit to 100 items
      })),
      setTimeline: (activities) => set({ timeline: activities }),
      addNotification: (message) => set((state) => ({
        notifications: [message, ...state.notifications].slice(0, 50)
      })),
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'vyapar-ai-storage'
    }
  )
);
