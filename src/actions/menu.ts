"use server";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// نستخدم مفتاح العميل العادي لأن هذه بيانات عامة للزبائن
const supabase = createClient(supabaseUrl, supabaseKey);

// تغليف الدالة بـ unstable_cache لحفظ النتيجة في ذاكرة الخادم
export const getCachedCafeMenu = unstable_cache(
  async (cafeSlug: string, tableNumber: string) => {
    try {
      // 1. جلب المقهى
      const { data: cafe } = await supabase
        .from('cafes')
        .select('id, name')
        .eq('slug', cafeSlug)
        .single();

      if (!cafe) return { error: 'cafe_not_found' };

      // 2. جلب الطاولة
      const { data: table } = await supabase
        .from('tables')
        .select('id')
        .eq('cafe_id', cafe.id)
        .eq('table_number', tableNumber)
        .single();

      if (!table) return { error: 'table_not_found', cafe };

      // 3. جلب المنتجات
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('cafe_id', cafe.id)
        .eq('is_active', true);

      return { 
        success: true, 
        cafe, 
        table, 
        products: products || [] 
      };
    } catch (error) {
      console.error("Cache Fetch Error:", error);
      return { error: 'server_error' };
    }
  },
  ['cafe-menu-cache'], // اسم مساحة الكاش
  { 
    revalidate: 120, // تحديث الكاش كل 60 ثانية (يمكنك زيادتها)
    tags: ['menu-data'] 
  }
);