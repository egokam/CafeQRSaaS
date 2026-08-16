"use client";

import { useState } from "react";
import { QrCode, Loader2, CheckCircle2, Printer, X, AlertTriangle, Trash2, AlertCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { adminCheckOrAddTable, adminDeleteTable } from "../../actions/auth";

export default function TablesTab({ cafeId, cafeSlug, cafeName, activeLang, t, tablesList, setTablesList, fetchTables, isLoadingTables, maxTables = 30 }: any) {
  const [tableNum, setTableNum] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [deleteUnderstood, setDeleteUnderstood] = useState(false);
  const [isDeletingTable, setIsDeletingTable] = useState(false);

  // 🌟 حماية القيم وحساب حالات الاستهلاك والتجاوز
  const safeMaxTables = Number(maxTables) || 30;
  const currentCount = tablesList.length;
  const isDiamond = safeMaxTables >= 9999;
  
  const isLimitReached = !isDiamond && currentCount >= safeMaxTables;
  const isOverage = !isDiamond && currentCount > safeMaxTables; // 🌟 حالة التخفيض (Downgrade Overage)
  
  const usagePercent = isDiamond ? 0 : Math.min(100, (currentCount / safeMaxTables) * 100);

  const handleGenerateSmartQR = async () => {
    if (!tableNum || !cafeId) return;

    if (isLimitReached) {
      alert(activeLang === 'ar' ? "العملية مقفلة. يرجى حذف الطاولات الزائدة أو ترقية باقتك." : "Action locked. Delete excess tables or upgrade plan.");
      return;
    }

    setIsGeneratingQr(true); setQrReady(false);
    const formattedTableNumber = `table_${tableNum}`;
    
    // نستقبل الآن `tableId` (الـ UUID المشفر) الراجع من قاعدة البيانات
    const { success, error, tableId } = await adminCheckOrAddTable(cafeId, formattedTableNumber);
    
    if (success && tableId) {
      const baseUrl = window.location.origin;
      // تم تغيير الرابط ليحتوي على الـ UUID بدلاً من رقم الطاولة
      setQrUrl(`${baseUrl}/${cafeSlug}/${tableId}`);
      setQrReady(true);
      fetchTables(cafeId);
    } else {
      alert(error || t.qrError || "فشل في جلب المعرف الفريد للطاولة.");
    }
    setIsGeneratingQr(false);
  };

  const confirmDeleteTable = async () => {
    if (!tableToDelete || !deleteUnderstood) return;
    setIsDeletingTable(true);
    setTablesList((prev: any) => prev.filter((t: any) => t.id !== tableToDelete));
    const res = await adminDeleteTable(tableToDelete);
    if (!res.success) { alert(t.deleteFailed); if (cafeId) fetchTables(cafeId); }
    setIsDeletingTable(false); setTableToDelete(null); setDeleteUnderstood(false);
  };

  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-border flex flex-col items-center max-w-3xl mx-auto mt-10 text-center relative overflow-hidden">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          /* Set exact physical dimensions for table cards (100mm x 150mm is a standard label/card size) */
          @page { size: 100mm 150mm; margin: 0; }
          
          html, body { 
            width: 100mm !important; 
            height: 150mm !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: hidden !important; 
            background-color: #fff; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          body * { visibility: hidden; } 
          #qr-print-area, #qr-print-area * { visibility: visible; } 
          
          #qr-print-area { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100mm !important; 
            height: 150mm !important; 
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            margin: 0 !important;
            padding: 4mm !important; /* Bleed area */
            z-index: 9999;
            box-sizing: border-box !important;
          }
          
          /* Override the visual wrapper to fit the physical card bounds exactly */
          .print-card-wrapper {
            width: 100% !important;
            height: 100% !important;
            border-width: 4px !important; /* Thinner border for physical print */
            border-radius: 12px !important;
            padding: 5mm !important;
            box-shadow: none !important;
          }

          /* Dynamically scale the QR code within the card */
          .qr-container svg {
            width: 100% !important;
            height: auto !important;
            max-width: 75mm !important;
          }
        }
      ` }} />
      
      <div className="bg-primary/10 p-4 rounded-full text-primary mb-4"><QrCode size={48} /></div>
      <h2 className="text-2xl font-bold mb-2">{t.qrTitle}</h2>
      <p className="text-muted-foreground mb-6 text-sm">{t.qrSub}</p>

      {/* 🌟 إشعار مخصص للحد الأقصى وحالة التجاوز */}
      {isLimitReached && (
        <div className={`mb-6 w-full max-w-sm p-4 rounded-xl flex items-start gap-3 text-left border ${isOverage ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`} dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {activeLang === 'ar' 
                ? (isOverage ? "تجاوز الحد الأقصى للطاولات" : "الحد الأقصى للطاولات") 
                : (isOverage ? "Table Limit Exceeded" : "Table Limit Reached")}
            </h4>
            <p className="text-xs mt-1 opacity-80">
              {activeLang === 'ar' 
                ? (isOverage 
                    ? `بسبب تغيير الباقة، أنت تتجاوز الحد المسموح به. يرجى حذف ${currentCount - safeMaxTables} طاولات لتتمكن من إضافة طاولات جديدة.` 
                    : "لا يمكنك إنشاء طاولات جديدة. يرجى ترقية باقتك.")
                : (isOverage 
                    ? `Due to plan change, you are over the limit. Please delete ${currentCount - safeMaxTables} tables to add new ones.` 
                    : "You cannot create new tables. Please upgrade your plan.")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full max-w-sm gap-4 mb-8">
        <div className={`flex items-center gap-4 bg-muted/30 p-4 rounded-2xl w-full border ${activeLang === 'ar' ? 'flex-row' : 'flex-row'} ${isLimitReached ? 'opacity-50 grayscale' : ''}`}>
          <label className="font-bold text-lg whitespace-nowrap">{t.tableNumLabel}</label>
          <input 
            type="number" 
            value={tableNum} 
            onChange={(e) => { setTableNum(e.target.value); setQrReady(false); }} 
            disabled={isLimitReached}
            className="border rounded-xl p-3 w-full text-center font-bold text-xl bg-white focus:outline-primary disabled:bg-gray-100 disabled:cursor-not-allowed" 
            min="1" 
            dir="ltr" 
          />
        </div>
        <button 
          onClick={handleGenerateSmartQR} 
          disabled={isGeneratingQr || !tableNum || isLimitReached} 
          className={`text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors ${
            isLimitReached 
              ? (isOverage ? 'bg-rose-400 cursor-not-allowed' : 'bg-gray-400 cursor-not-allowed')
              : 'bg-primary hover:bg-primary/90 disabled:opacity-50'
          }`}
        >
          {isGeneratingQr ? (
            <><Loader2 className="animate-spin" size={20} /> {t.processing}</>
          ) : isLimitReached ? (
            isOverage ? "Locked (Overage) 🔒" : "Locked 🔒"
          ) : (
            <><CheckCircle2 size={20} /> {t.generateQrBtn}</>
          )}
        </button>
      </div>

      {qrReady && (
        <>
          <div id="qr-print-area" className="w-full flex justify-center animate-in zoom-in duration-300">
            <div className="print-card-wrapper w-[400px] aspect-[2/3] border-[8px] border-black rounded-[3rem] p-8 flex flex-col items-center justify-between bg-white shadow-2xl">
              <h3 className="text-4xl font-black text-black uppercase tracking-tighter text-center mt-2">{cafeName || "Cafe"}</h3>
              
              <div className="bg-black text-white px-8 py-2.5 rounded-full font-black text-2xl tracking-widest mt-2">
                {t.table} {tableNum}
              </div>
              
              <div className="qr-container p-4 border-4 border-gray-100 rounded-[2rem] w-full flex items-center justify-center my-4">
                <QRCode value={qrUrl} className="w-[220px] h-auto" level="H" fgColor="#000000" bgColor="#ffffff" />
              </div>
              
              <div className="flex items-center gap-3 text-black mb-2">
                <QrCode size={24} className="shrink-0" />
                <p className="text-lg font-black uppercase tracking-widest leading-none text-center">
                  {t.scanToOrder}
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => window.print()} className="mt-8 bg-foreground text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 text-lg hover:scale-105 transition-transform"><Printer size={24} /> {t.printBtn}</button>
        </>
      )}

      <div className="w-full mt-16 pt-8 border-t border-border/50 animate-in fade-in duration-500">
        
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            {activeLang === 'ar' ? 'الطاولات المسجلة حالياً' : activeLang === 'fr' ? 'Tables Enregistrées' : 'Registered Tables'}
          </h3>
          <div className={`flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-xl border ${isOverage ? 'border-rose-200 bg-rose-50' : 'border-border'}`}>
            <span className={`text-xs font-bold uppercase ${isOverage ? 'text-rose-500' : 'text-muted-foreground'}`}>{activeLang === 'ar' ? 'الاستهلاك' : 'Usage'}:</span>
            <span className={`font-black font-mono ${isOverage ? 'text-rose-600' : 'text-primary'}`} dir="ltr">{currentCount} / {isDiamond ? "♾️" : safeMaxTables}</span>
          </div>
        </div>

        {!isDiamond && (
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-8">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isOverage ? 'bg-rose-500' : isLimitReached ? 'bg-amber-500' : 'bg-primary'}`} 
              style={{ width: `${usagePercent}%` }} 
            />
          </div>
        )}

        {isLoadingTables ? (
          <div className="flex justify-center p-6"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : tablesList.length === 0 ? (
          <p className="text-muted-foreground text-sm font-bold bg-muted/20 p-6 rounded-2xl border border-dashed">{activeLang === 'ar' ? 'لا توجد طاولات مسجلة بعد.' : 'No tables registered yet.'}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tablesList.map((tItem: any) => (
              <div key={tItem.id} className={`bg-muted/10 border border-border/50 rounded-2xl p-4 flex justify-between items-center hover:bg-muted/30 transition-colors shadow-sm ${isOverage ? 'opacity-90' : ''}`}>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">{activeLang === 'ar' ? 'طاولة' : 'Table'}</span>
                  <span className="font-black text-2xl text-foreground font-mono">{tItem.table_number.replace('table_', '')}</span>
                </div>
                <button onClick={() => {setTableToDelete(tItem.id); setDeleteUnderstood(false);}} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all active:scale-90"><Trash2 size={20} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setTableToDelete(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground bg-muted/50 p-2 rounded-full transition-colors"><X size={20} /></button>
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto"><AlertTriangle size={32} /></div>
            <h2 className="text-2xl font-black text-center mb-4">{t.deleteWarningTitle}</h2>
            <p className="text-muted-foreground text-center text-sm font-bold leading-relaxed mb-8">{t.deleteWarningDesc}</p>
            <label className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl cursor-pointer mb-8 hover:bg-red-100/50 transition-colors">
              <input type="checkbox" checked={deleteUnderstood} onChange={(e) => setDeleteUnderstood(e.target.checked)} className="mt-1 w-5 h-5 accent-red-500 cursor-pointer" />
              <span className="text-sm font-bold text-red-900 leading-snug select-none">{t.understandCheckbox}</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setTableToDelete(null)} disabled={isDeletingTable} className="flex-1 py-4 font-bold rounded-2xl bg-muted text-foreground hover:bg-muted/80 transition-colors">{t.cancelBtn}</button>
              <button onClick={confirmDeleteTable} disabled={!deleteUnderstood || isDeletingTable} className="flex-1 py-4 font-bold rounded-2xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">{isDeletingTable ? <Loader2 className="animate-spin" size={20} /> : t.confirmDeleteBtn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}