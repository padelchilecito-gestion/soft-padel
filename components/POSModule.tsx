import React, { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Product, CartItem, ClubConfig, PaymentMethod } from '../types';
import { COLOR_THEMES } from '../constants';

interface POSModuleProps {
  products: Product[];
  config: ClubConfig;
  onProcessSale: (items: CartItem[], total: number, method: PaymentMethod) => void;
}

export const POSModule: React.FC<POSModuleProps> = ({ products, config, onProcessSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const theme = COLOR_THEMES[config.courtColorTheme];

  const categories: string[] = ['all', ...Array.from(new Set(products.map((p) => p.category))) as string[]];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
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
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500">
      
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        {/* Header/Filter */}
        <div className="p-4 border-b border-white/10 space-y-4">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Buscar producto..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-3.5 text-slate-500 h-5 w-5"/>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat: string) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                            ${selectedCategory === cat ? `${theme.primary} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                        `}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                    <div 
                        key={product.id} 
                        onClick={() => addToCart(product)}
                        className="group bg-slate-800/50 hover:bg-slate-700/50 p-3 rounded-xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all active:scale-95 flex flex-col"
                    >
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-slate-900">
                            <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                            {product.stock <= product.minStockAlert && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                                    Low Stock
                                </span>
                            )}
                        </div>
                        <h4 className="text-white font-medium text-sm leading-tight mb-1 line-clamp-2 flex-1">{product.name}</h4>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-slate-400 text-xs">{product.stock} un.</span>
                            <span className="text-yellow-400 font-bold">${product.price}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 bg-slate-100 border-b border-slate-200">
            <h2 className="text-slate-800 font-bold text-xl flex items-center gap-2">
                <ShoppingCart className="text-slate-600"/>
                Carrito Actual
            </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart size={48} className="mb-4 opacity-20"/>
                    <p>Carrito vacío</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                         <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex-1 min-w-0">
                             <h4 className="text-slate-800 font-medium text-sm truncate">{item.name}</h4>
                             <p className="text-slate-500 text-xs">${item.price * item.quantity}</p>
                         </div>
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
            <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium">Total a Pagar</span>
                <span className="text-3xl font-black text-slate-800">${total.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => { onProcessSale(cart, total, PaymentMethod.CASH); setCart([]); }}
                    disabled={cart.length === 0}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-200 transition-all disabled:opacity-50"
                >
                    <Banknote size={24} className="mb-1"/>
                    <span className="text-xs font-bold">Efectivo</span>
                </button>
                <button 
                    onClick={() => { onProcessSale(cart, total, PaymentMethod.QR); setCart([]); }}
                    disabled={cart.length === 0}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-50"
                >
                    <QrCode size={24} className="mb-1"/>
                    <span className="text-xs font-bold">QR MP</span>
                </button>
                <button 
                    onClick={() => { onProcessSale(cart, total, PaymentMethod.TRANSFER); setCart([]); }}
                    disabled={cart.length === 0}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-200 transition-all disabled:opacity-50"
                >
                    <CreditCard size={24} className="mb-1"/>
                    <span className="text-xs font-bold">Transf.</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};