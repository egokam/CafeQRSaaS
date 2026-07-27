"use client";

import { Lock, TrendingUp, DollarSign, CheckCircle2, History } from "lucide-react";

export default function SalesTab({ cafeId, activeLang, t, planType, monthlyOrders, monthlyIncome, isLoadingSales, fetchMonthlySales, setActiveTab }: any) {
  if (planType === 'silver' || planType === 'starter') {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
        <div className="bg-white p-12 rounded-3xl border shadow-sm flex flex-col items-center justify-center text-center">
          <div className="bg-amber-100 p-6 rounded-full text-amber-500 mb-6"><Lock size={48} /></div>
          <h3 className="text-2xl font-black mb-4 text-foreground">{t.tabSales}</h3>
          <p className="text-muted-foreground max-w-md font-bold mb-8 leading-relaxed">{t.analyticsLocked}</p>
          <button onClick={() => setActiveTab('billing')} className="bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"><TrendingUp size={20} /> {t.upgradeToGold}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
          <div><span className="text-xs font-bold text-muted-foreground block">{t.currentMonthIncome}</span><h3 className="text-3xl font-black text-emerald-600 mt-1">{monthlyIncome.toFixed(2)} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3></div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><DollarSign size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
          <div><span className="text-xs font-bold text-muted-foreground block">{t.completedOrders}</span><h3 className="text-3xl font-black text-foreground mt-1">{monthlyOrders.length} <span className="text-sm font-bold text-muted-foreground">{t.tabMenu === 'Menu' ? 'Orders' : 'طلب'}</span></h3></div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><CheckCircle2 size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
          <div><span className="text-xs font-bold text-muted-foreground block">{t.avgCustomerSpend}</span><h3 className="text-3xl font-black text-primary mt-1">{monthlyOrders.length > 0 ? (monthlyIncome / monthlyOrders.length).toFixed(2) : "0.00"} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3></div>
          <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0"><TrendingUp size={28} /></div>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-3xl border shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div><h3 className="font-extrabold text-xl">{t.salesLogTitle} {new Date().toLocaleString(activeLang === 'ar' ? 'ar-MA' : activeLang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' })}</h3><p className="text-xs text-muted-foreground mt-1">{t.salesLogSub}</p></div>
          <button onClick={() => cafeId && fetchMonthlySales(cafeId)} className="p-2.5 bg-muted rounded-xl hover:bg-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors"><History size={16} /> {t.refreshLog}</button>
        </div>
        {isLoadingSales ? (
          <div className="py-12 text-center font-bold text-muted-foreground">{t.calculatingIncome}</div>
        ) : monthlyOrders.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl font-bold">{t.noSalesMonth}</div>
        ) : (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {monthlyOrders.map((ord: any) => (
              <div key={ord.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/15 border rounded-2xl gap-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0 text-lg">✓</div>
                  <div>
                    <div className="font-extrabold text-sm flex items-center gap-2"><span>{t.table} {ord.tables?.table_number?.replace('table_', '') || t.directPos}</span><span className="text-[10px] font-mono text-muted-foreground">#{ord.id.split('-')[0]}</span></div>
                    <div className="text-xs text-muted-foreground font-bold mt-1 leading-relaxed">
                      {ord.items.map((it: any) => `${it.quantity}x ${activeLang === 'en' && it.name_en ? it.name_en : activeLang === 'fr' && it.name_fr ? it.name_fr : it.name_ar}`).join(' + ')}
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-base font-black text-emerald-600 font-mono">{Number(ord.total_amount).toFixed(2)} MAD</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(ord.created_at).toLocaleString(activeLang === 'ar' ? 'ar-MA' : activeLang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}