import React, { useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, Image as ImageIcon, X, Check, Upload, ChevronRight } from 'lucide-react';
import { Product, ClubConfig } from '../types';
import { COLOR_THEMES } from '../constants';

interface InventoryModuleProps {
  products: Product[];
  config: ClubConfig;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const EmptyProduct: Product = {
    id: '',
    name: '',
    category: 'Bebidas',
    price: 0,
    stock: 0,
    minStockAlert: 5,
    imageUrl: ''
};

const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL(file.type));
                } else {
                    resolve(event.target?.result as string);
                }
            };
        };
    });
};

export const InventoryModule: React.FC<InventoryModuleProps> = ({ products, config, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>(EmptyProduct);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  
  const theme = COLOR_THEMES[config.courtColorTheme];
  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category)))];

  const handleOpenAdd = () => {
      setEditingProduct(null);
      setFormData({...EmptyProduct, id: Date.now().toString()});
      setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
      setEditingProduct(product);
      setFormData(product);
      setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const optimizedImage = await processImage(file);
              setFormData(prev => ({ ...prev, imageUrl: optimizedImage }));
          } catch (error) {
              console.error("Error procesando imagen", error);
              alert("Error al procesar la imagen.");
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || formData.price <= 0) return;
      if (editingProduct) onUpdateProduct(formData);
      else onAddProduct(formData);
      setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm('¿Estás seguro de eliminar este producto?')) onDeleteProduct(id);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500 pb-20 md:pb-0">
      {/* Header Compacto con Glassmorphism */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                <Package size={24}/> 
             </div>
             <div>
                 <h2 className="text-xl font-bold text-white leading-none">Inventario</h2>
                 <p className="text-xs text-slate-400 mt-1">{products.length} productos</p>
             </div>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
             <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input w-full rounded-lg py-2.5 pl-9 text-sm"
                />
                <Search className="absolute left-3 top-3 text-slate-500 h-4 w-4"/>
            </div>
            
            <div className="flex gap-2">
                <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="glass-input rounded-lg px-3 py-2 text-sm cursor-pointer"
                >
                    {categories.map(c => <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>)}
                </select>

                <button 
                    onClick={handleOpenAdd}
                    className={`bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg whitespace-nowrap`}
                >
                    <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
                </button>
            </div>
        </div>
      </div>

      {/* List View Glassmorphism */}
      <div className="glass-panel rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[3fr_1.5fr_1.5fr_1fr_0.5fr] gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div>Producto</div>
              <div>Categoría</div>
              <div>Stock</div>
              <div className="text-right">Precio</div>
              <div className="text-center">Acciones</div>
          </div>

          <div className="divide-y divide-white/5">
              {filteredProducts.map(product => {
                  const isLowStock = product.stock <= product.minStockAlert;
                  return (
                    <div 
                        key={product.id} 
                        onClick={() => handleOpenEdit(product)}
                        className="group relative flex flex-col md:grid md:grid-cols-[3fr_1.5fr_1.5fr_1fr_0.5fr] gap-3 md:gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLowStock ? 'bg-red-500' : 'bg-green-500'} md:hidden`}></div>
                        
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-white/10 relative">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={20}/></div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-white font-semibold text-sm leading-tight truncate pr-2">{product.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 md:hidden">{product.category}</p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center text-sm text-slate-400">
                            <span className="bg-white/5 px-2 py-1 rounded text-xs">{product.category}</span>
                        </div>

                        <div className="flex items-center justify-between md:justify-start">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium border
                                ${isLowStock 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                    : 'bg-green-500/10 border-green-500/20 text-green-400'}
                            `}>
                                {isLowStock ? <AlertTriangle size={12}/> : <Check size={12}/>}
                                <span>{product.stock} un.</span>
                            </div>
                            <span className="md:hidden font-mono font-bold text-white">${product.price}</span>
                        </div>

                        <div className="hidden md:flex items-center justify-end font-mono font-bold text-white text-sm">
                            ${product.price}
                        </div>

                        <div className="hidden md:flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(product); }} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500"><Edit2 size={16}/></button>
                             <button onClick={(e) => handleDelete(product.id, e)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-500"><Trash2 size={16}/></button>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-slate-600"><ChevronRight size={16} /></div>
                    </div>
                  );
              })}
          </div>
          
          {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                  <Package size={48} className="mx-auto mb-3 opacity-20"/>
                  <p>No se encontraron productos.</p>
              </div>
          )}
      </div>

      {/* Add/Edit Modal con Glassmorphism */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="glass-panel rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5"><X size={20}/></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                      <div className="flex gap-4">
                           <div className="w-20 h-20 bg-slate-800 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-500 transition-all flex-shrink-0">
                                {formData.imageUrl ? (
                                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview"/>
                                ) : (
                                    <ImageIcon className="text-slate-500 group-hover:text-blue-500"/>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" onChange={handleImageUpload} />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <Upload className="text-white" size={16}/>
                                </div>
                           </div>

                           <div className="flex-1 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full rounded-lg p-2.5 text-sm" placeholder="Ej: Pelotas X3" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="glass-input w-full rounded-lg p-2.5 text-sm cursor-pointer">
                                        <option className="bg-slate-900" value="Bebidas">Bebidas</option>
                                        <option className="bg-slate-900" value="Comestibles">Comestibles</option>
                                        <option className="bg-slate-900" value="Accesorios">Accesorios</option>
                                        <option className="bg-slate-900" value="Paletas">Paletas</option>
                                        <option className="bg-slate-900" value="Indumentaria">Indumentaria</option>
                                        <option className="bg-slate-900" value="Servicios">Servicios</option>
                                    </select>
                                </div>
                           </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Precio ($)</label>
                              <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="glass-input w-full rounded-lg p-2.5 text-white font-mono" />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Stock</label>
                              <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="glass-input w-full rounded-lg p-2.5 text-white font-mono" />
                          </div>
                      </div>

                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <div className="flex justify-between mb-2">
                             <label className="block text-xs font-medium text-slate-400">Alerta Stock Bajo</label>
                             <span className="text-xs font-mono text-yellow-500">{formData.minStockAlert} un.</span>
                          </div>
                          <input type="range" min="0" max="50" value={formData.minStockAlert} onChange={e => setFormData({...formData, minStockAlert: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                      </div>
                      
                      {editingProduct && (
                        <button type="button" onClick={(e) => { handleDelete(editingProduct.id, e as any); setIsModalOpen(false); }} className="w-full py-2 flex items-center justify-center gap-2 text-red-400 text-sm hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={16}/> Eliminar Producto
                        </button>
                      )}

                      <div className="pt-2">
                          <button type="submit" className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${theme.primary} hover:opacity-90 shadow-lg active:scale-95 transition-all`}>
                              <Check size={18}/> Guardar Cambios
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
