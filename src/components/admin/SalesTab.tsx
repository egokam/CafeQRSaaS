"use client";

import { useMemo } from "react";
import { Lock, TrendingUp, DollarSign, CheckCircle2, History, Download, BarChart3, Coffee, CalendarDays } from "lucide-react";

// 1. Strict Type Definitions
interface OrderItem {
  id: string;
  name_ar?: string;
  name_en?: string;
  name_fr?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
  tables?: { table_number: string };
}

interface SalesTabProps {
  cafeId: string;
  activeLang: 'en' | 'fr' | 'ar';
  t: any;
  planType: string;
  monthlyOrders: Order[];
  monthlyIncome: number;
  isLoadingSales: boolean;
  fetchMonthlySales: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function SalesTab({ 
  cafeId, 
  activeLang, 
  t, 
  planType, 
  monthlyOrders = [], 
  monthlyIncome = 0, 
  isLoadingSales, 
  fetchMonthlySales, 
  setActiveTab 
}: SalesTabProps) {
  
  const isLocked = planType === 'silver' || planType === 'starter';
  const validOrders = Array.isArray(monthlyOrders) ? monthlyOrders : [];

  // 2. Data Aggregation & Analytics Engine
  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let todaysIncome = 0;
    let todaysOrderCount = 0;
    
    const productStats: Record<string, { name: string, qty: number, revenue: number }> = {};

    validOrders.forEach(ord => {
      const orderDate = String(ord.created_at).split('T')[0];
      const orderTotal = Number(ord.total_amount) || 0;

      if (orderDate === today) {
        todaysIncome += orderTotal;
        todaysOrderCount += 1;
      }

      if (Array.isArray(ord.items)) {
        ord.items.forEach(item => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const name = activeLang === 'en' && item.name_en ? item.name_en 
                     : activeLang === 'fr' && item.name_fr ? item.name_fr 
                     : item.name_ar || 'Unknown';

          if (!productStats[item.id]) {
            productStats[item.id] = { name, qty: 0, revenue: 0 };
          }
          productStats[item.id].qty += qty;
          productStats[item.id].revenue += (price * qty);
        });
      }
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4); // Get top 4 best sellers

    return { todaysIncome, todaysOrderCount, topProducts };
  }, [validOrders, activeLang]);

  // 3. Export Utility
  const handleExportCSV = () => {
    if (validOrders.length === 0) return;

    const headers = 
      activeLang === 'ar' ? ["معرف الطلب", "التاريخ", "الطاولة", "الإجمالي (MAD)", "المنتجات"] 
    : activeLang === 'fr' ? ["ID Commande", "Date", "Table", "Total (MAD)", "Articles"]
    : ["Order ID", "Date", "Table", "Total (MAD)", "Items"];

    const rows = validOrders.map(o => {
      const id = String(o.id || '').split('-')[0];
      const date = o.created_at ? new Date(o.created_at).toLocaleString() : '';
      const table = o.tables?.table_number?.replace('table_', '') || (activeLang === 'ar' ? 'كاشير' : 'POS');
      const total = Number(o.total_amount || 0).toFixed(2);
      const items = Array.isArray(o.items) ? o.items.map(i => {
        const name = i.name_en || i.name_fr || i.name_ar || 'Item';
        return `${i.quantity}x ${name}`;
      }).join(' + ') : '';

      return [id, date, table, total, items];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><BarChart3 size={24} /></div>
          <div>
            <h2 className="text-xl font-black">{t.tabSales}</h2>
            <p className="text-xs text-muted-foreground font-bold">{new Date().toLocaleString(activeLang === 'ar' ? 'ar-MA' : activeLang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })} Overview</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            disabled={isLocked || isLoadingSales}
            onClick={() => cafeId && fetchMonthlySales(cafeId)} 
            className="flex-1 sm:flex-none p-3 bg-muted rounded-xl hover:bg-gray-200 text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <History size={16} /> {t.refreshLog}
          </button>
          <button 
            disabled={isLocked || validOrders.length === 0}
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download size={16} /> {activeLang === 'ar' ? 'تحميل CSV' : activeLang === 'fr' ? 'Exporter CSV' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border shadow-sm">
          <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">
            {activeLang === 'ar' ? "مبيعات اليوم" : activeLang === 'fr' ? "Revenus du Jour" : "Today's Revenue"}
          </span>
          <h3 className="text-2xl font-black text-emerald-600">
            {analytics.todaysIncome.toFixed(2)} <span className="text-xs text-muted-foreground">MAD</span>
          </h3>
          <span className="text-xs font-bold text-muted-foreground mt-2 block flex items-center gap-1">
            <CalendarDays size={12} /> {analytics.todaysOrderCount} {activeLang === 'ar' ? "طلبات" : "orders"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm">
          <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">{t.currentMonthIncome}</span>
          <h3 className="text-2xl font-black text-foreground">
            {monthlyIncome.toFixed(2)} <span className="text-xs text-muted-foreground">MAD</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm">
          <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">{t.completedOrders}</span>
          <h3 className="text-2xl font-black text-foreground">
            {validOrders.length} <span className="text-xs text-muted-foreground">{activeLang === 'ar' ? 'طلب' : 'Orders'}</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm">
          <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">{t.avgCustomerSpend}</span>
          <h3 className="text-2xl font-black text-primary">
            {validOrders.length > 0 ? (monthlyIncome / validOrders.length).toFixed(2) : "0.00"} <span className="text-xs text-muted-foreground">MAD</span>
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        
        {/* Paywall Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/40 rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-amber-200">
            <div className="bg-amber-100 p-5 rounded-full text-amber-500 mb-4 shadow-inner">
              <Lock size={40} />
            </div>
            <h3 className="text-2xl font-black mb-2 text-foreground">Analytics Locked</h3>
            <p className="text-sm text-muted-foreground font-bold mb-6 max-w-sm">{t.analyticsLocked}</p>
            <button 
              onClick={() => setActiveTab('billing')} 
              className="bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <TrendingUp size={18} /> {t.upgradeToGold}
            </button>
          </div>
        )}

        {/* Left Column: Top Sellers (Requires DB aggregation) */}
        <div className={`col-span-1 bg-white p-6 rounded-3xl border shadow-sm ${isLocked ? 'blur-[4px] opacity-50 select-none pointer-events-none' : ''}`}>
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Coffee size={18} className="text-primary"/> 
            {activeLang === 'ar' ? 'المنتجات الأكثر مبيعاً' : activeLang === 'fr' ? 'Meilleures Ventes' : 'Top Sellers'}
          </h3>
          
          <div className="space-y-4">
            {analytics.topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-muted-foreground border-2 border-dashed rounded-xl">
                No data available
              </div>
            ) : (
              analytics.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[120px]">{product.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{product.qty} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-600 font-mono">{product.revenue.toFixed(2)} MAD</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed Order Log */}
        <div className={`col-span-1 lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm ${isLocked ? 'blur-[4px] opacity-50 select-none pointer-events-none' : ''}`}>
          <h3 className="font-extrabold text-lg mb-4">{t.salesLogTitle}</h3>
          
          {isLoadingSales && !isLocked ? (
            <div className="py-20 text-center font-bold text-muted-foreground animate-pulse">{t.calculatingIncome}</div>
          ) : validOrders.length === 0 && !isLocked ? (
            <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-2xl font-bold">{t.noSalesMonth}</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {validOrders.map((ord: Order) => (
                <div key={ord.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/20 border rounded-2xl gap-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2">
                        <span>{t.table} {ord.tables?.table_number?.replace('table_', '') || (activeLang === 'ar' ? 'كاشير' : 'POS')}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">#{String(ord.id).split('-')[0]}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-bold mt-1 line-clamp-1">
                        {Array.isArray(ord.items) 
                          ? ord.items.map(it => `${Number(it.quantity) || 1}x ${activeLang === 'en' && it.name_en ? it.name_en : activeLang === 'fr' && it.name_fr ? it.name_fr : it.name_ar || 'Item'}`).join(' + ')
                          : 'Unknown items'}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-sm font-black text-foreground font-mono">{Number(ord.total_amount || 0).toFixed(2)} MAD</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}