/**
 * Gerenciamento de estado de Usuário, Carrinho e Pedidos (com persistência local)
 */

export type UserProfile = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  fileType: "stl" | "fbx";
  fileUrl: string;
  category: string;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  frete: number;
  total: number;
  shippingMethod: string;
  paymentMethod: "PIX" | "CARTAO" | "BOLETO" | "PAYPAL";
  user: UserProfile;
  status: "APROVADO" | "AGUARDANDO_PAGAMENTO" | "ENVIADO";
};

const USER_STORAGE_KEY = "alojadomeunamorado_user";
const CART_STORAGE_KEY = "alojadomeunamorado_cart";
const ORDERS_STORAGE_KEY = "alojadomeunamorado_orders";

// Usuário
export function getSavedUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("user_updated"));
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event("user_updated"));
}

// Carrinho
export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCart(item: CartItem): void {
  if (typeof window === "undefined") return;
  const items = getCartItems();
  const existing = items.find((i) => i.id === item.id);
  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    items.push({ ...item, quantity: item.quantity || 1 });
  }
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart_updated"));
}

export function removeFromCart(id: string): void {
  if (typeof window === "undefined") return;
  const items = getCartItems().filter((i) => i.id !== id);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart_updated"));
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cart_updated"));
}

// Pedidos
export function saveOrder(order: Order): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const orders: Order[] = raw ? JSON.parse(raw) : [];
    orders.unshift(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error("Erro ao salvar pedido:", err);
  }
}

export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
