import React, { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, X, Copy, Share2, Check, AlertTriangle } from 'lucide-react';
import { Product, CartItem, ClubConfig, PaymentMethod } from '../types';
import { COLOR_THEMES } from '../constants';

interface POSModuleProps {
  products: Product[];
  config: ClubConfig;
  onProcessSale: (items: CartItem[], total: number, method: PaymentMethod) => void;
}

// Helper seguro para formato de dinero
const formatMoney = (amount?: number | null) => {
    return (amount || 0).toLocaleString();
};

export const POSModule: React.FC<POSModuleProps> = ({ products, config, onProcessSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, type: PaymentMethod | null }>({ isOpen: false, type: null });

  const theme = COLOR_THEMES[config.courtColorTheme];
  const categories: string[] = ['all', ...Array.from(new Set(products.map((p) => p.category))) as string[]];

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("No hay stock disponible.");

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
             alert(`Stock máximo alcanzado (${product.stock})`);
             return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const original = products.find(p => p.id === productId);
        const maxStock = original ? original.stock : item.stock;
        const newQty = item.quantity + delta;
        
        if (delta > 0 && newQty > maxStock) {
            alert(`No puedes superar el stock (${maxStock})`);
            return item;
        }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Cálculo del total con recargo (si aplica)
  const feePercentage = config.mpFeePercentage || 0;
  const surcharge = paymentModal.type === PaymentMethod.QR ? (total * feePercentage / 100) : 0;
  const finalTotal = total + surcharge;

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePaymentClick = (method: PaymentMethod) => {
      if (method === PaymentMethod.CASH) {
          // Efectivo: Proceso directo
          if (confirm(`¿Confirmar venta por $${formatMoney(total)} en Efectivo?`)) {
              onProcessSale(cart, total, method);
              setCart([]);
          }
      } else {
          // Transferencia o QR: Abrir modal
          setPaymentModal({ isOpen: true, type: method });
      }
  };

  const confirmModalPayment = () => {
      if (paymentModal.type) {
          onProcessSale(cart, finalTotal, paymentModal.type);
          setCart([]);
          setPaymentModal({ isOpen: false, type: null });
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500">
      
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 space-y-4">
            <div className="relative">
                <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"/>
                <Search className="absolute left-3 top-3.5 text-slate-500 h-5 w-5"/>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat: string) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? `${theme.primary} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => {
                    const hasStock = product.stock > 0;
                    return (
                        <div key={product.id} onClick={() => hasStock && addToCart(product)} className={`group bg-slate-800/50 p-3 rounded-xl border border-white/5 flex flex-col transition-all ${hasStock ? 'hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer active:scale-95' : 'opacity-50 grayscale cursor-not-allowed border-red-900/30'}`}>
                            <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-slate-900">
                                <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                {product.stock <= 0 ? (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1"><AlertTriangle size={10}/> AGOTADO</span></div>
                                ) : (
                                    product.stock <= product.minStockAlert && (<span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">Quedan {product.stock}</span>)
                                )}
                            </div>
                            <h4 className="text-white font-medium text-sm leading-tight mb-1 line-clamp-2 flex-1">{product.name}</h4>
                            <div className="flex justify-between items-center mt-2"><span className={`text-xs font-bold ${hasStock ? 'text-slate-400' : 'text-red-400'}`}>{hasStock ? `${product.stock} un.` : 'Sin Stock'}</span><span className="text-yellow-400 font-bold">${formatMoney(product.price)}</span></div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 bg-slate-100 border-b border-slate-200">
            <h2 className="text-slate-800 font-bold text-xl flex items-center gap-2"><ShoppingCart className="text-slate-600"/> Carrito Actual</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400"><ShoppingCart size={48} className="mb-4 opacity-20"/><p>Carrito vacío</p></div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                         <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0"><img src={item.imageUrl} className="w-full h-full object-cover" alt="" /></div>
                         <div className="flex-1 min-w-0"><h4 className="text-slate-800 font-medium text-sm truncate">{item.name}</h4><p className="text-slate-500 text-xs">${formatMoney(item.price * item.quantity)}</p></div>
                         <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                             <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Minus size={14}/></button>
                             <span className="text-sm font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                             <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Plus size={14}/></button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                    </div>
                ))
            )}
        </div>

        {/* Totals & Pay */}
        <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-6"><span className="text-slate-500 font-medium">Total a Pagar</span><span className="text-3xl font-black text-slate-800">${formatMoney(total)}</span></div>
            <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handlePaymentClick(PaymentMethod.CASH)} disabled={cart.length === 0} className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-200 transition-all disabled:opacity-50"><Banknote size={24} className="mb-1"/><span className="text-xs font-bold">Efectivo</span></button>
                <button onClick={() => handlePaymentClick(PaymentMethod.QR)} disabled={cart.length === 0} className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-50"><QrCode size={24} className="mb-1"/><span className="text-xs font-bold">QR MP</span></button>
                <button onClick={() => handlePaymentClick(PaymentMethod.TRANSFER)} disabled={cart.length === 0} className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-200 transition-all disabled:opacity-50"><CreditCard size={24} className="mb-1"/><span className="text-xs font-bold">Transf.</span></button>
            </div>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {paymentModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
              <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
                  <button onClick={() => setPaymentModal({ isOpen: false, type: null })} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X size={20}/></button>
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/5">
                          {paymentModal.type === PaymentMethod.QR ? <QrCode size={32} className="text-blue-400"/> : <CreditCard size={32} className="text-purple-400"/>}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">
                          {paymentModal.type === PaymentMethod.QR ? 'Cobro con QR' : 'Transferencia'}
                      </h3>
                      {paymentModal.type === PaymentMethod.QR && feePercentage > 0 && (
                          <div className="text-xs text-orange-400 mb-1 font-bold">Incluye {feePercentage}% de recargo</div>
                      )}
                      <p className="text-slate-400 text-sm">
                          Total a cobrar: <span className="text-white font-bold text-lg">${formatMoney(finalTotal)}</span>
                      </p>
                  </div>

                  {paymentModal.type === PaymentMethod.QR && (
                      <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit shadow-inner">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Pago%20de%20$${finalTotal}%20en%20PadelManager`} alt="QR de Pago" className="w-48 h-48 object-contain" />
                          <p className="text-black/50 text-[10px] text-center mt-2 font-mono">Escanea con Mercado Pago</p>
                      </div>
                  )}

                  {paymentModal.type === PaymentMethod.TRANSFER && (
                      <div className="space-y-4 mb-6">
                          <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 text-center">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Alias</p>
                              <div className="flex items-center justify-center gap-2">
                                  <span className="text-xl font-mono text-white font-bold tracking-wider">{config.mpAlias || 'NO-CONFIG'}</span>
                                  <button onClick={() => navigator.clipboard.writeText(config.mpAlias || '')} className="text-slate-400 hover:text-white p-1"><Copy size={14}/></button>
                              </div>
                          </div>
                          <button onClick={() => { const text = `Hola! Aquí tienes el alias para transferir $${finalTotal}: *${config.mpAlias}*`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                              <Share2 size={18}/> Compartir por WhatsApp
                          </button>
                      </div>
                  )}

                  <button onClick={confirmModalPayment} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                      <Check size={20}/> Confirmar Cobro
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
