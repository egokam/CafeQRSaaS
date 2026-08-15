import { create } from 'zustand';

// 1. تحديد شكل المنتج داخل السلة
export interface CartItem {
  id: string; // معرّف فريد داخل السلة (يتم تكوينه عادة من product_id والتعديلات)
  product_id: string; // معرّف المنتج الحقيقي في قاعدة البيانات
  name_ar: string;
  name_en?: string;
  name_fr?: string;
  price: number; // السعر النهائي شامل التعديلات
  quantity: number;
  image_url: string;
  modifiers: Record<string, number>; // التعديلات المحددة بصيغة { option_id: quantity }
}

// 2. تحديد ما يمكن للسلة فعله (الأفعال)
interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
}

// 3. بناء ذاكرة السلة
export const useCart = create<CartStore>((set, get) => ({
  items: [], // السلة فارغة في البداية

  // إضافة منتج (إذا كان موجوداً بنفس التعديلات تماماً نزيد الكمية، وإذا كان جديداً نضيفه)
  addItem: (newItem) => set((state) => {
    const existingItem = state.items.find((item) => item.id === newItem.id);
    if (existingItem) {
      return {
        items: state.items.map((item) =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity } : item
        ),
      };
    }
    return { items: [...state.items, { ...newItem }] };
  }),

  // إزالة منتج (ننقص الكمية 1 في كل مرة، وإذا أصبحت 1 يتم حذفه عند النقر)
  removeItem: (id) => set((state) => {
    const existingItem = state.items.find((item) => item.id === id);
    if (existingItem?.quantity === 1) {
      return { items: state.items.filter((item) => item.id !== id) };
    }
    return {
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      ),
    };
  }),

  // تفريغ السلة بالكامل بعد تأكيد الطلب
  clearCart: () => set({ items: [] }),

  // حساب السعر الإجمالي بالدرهم تلقائياً
  totalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  
  // حساب عدد المنتجات (الرقم الذي سيظهر فوق أيقونة السلة)
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));