import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Check, X, RefreshCw, Plus, CalendarDays, Tag, Percent, MessageCircle, User, ChevronLeft, ChevronRight, MapPin, Edit2, Trash2, Banknote, QrCode, CreditCard, Save, AlertCircle } from 'lucide-react';
import { Booking, BookingStatus, ClubConfig, Court, PaymentMethod } from '../types';
import { COLOR_THEMES } from '../constants';

interface BookingModuleProps {
  bookings: Booking[];
  courts: Court[];
  config: ClubConfig;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  onToggleRecurring: (id: string) => void;
  onUpdateBooking: (booking: Booking) => void;
  onAddBooking: (booking: Booking) => void;
}

export const BookingModule: React.FC<BookingModuleProps> = ({ bookings, courts, config, onUpdateStatus, onToggleRecurring, onUpdateBooking, onAddBooking }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  
  const theme = COLOR_THEMES[config.courtColorTheme];

  // 1. Filtrar reservas del día seleccionado y que NO estén canceladas
  // 2. Ordenar por horario
  const dailyBookings = bookings
    .filter(b => b.date === selectedDate && b.status !== BookingStatus.CANCELLED)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleDateChange = (days: number) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNotify = (booking: Booking) => {
    const court = courts.find(c => c.id === booking.courtId);
    const message = `Hola *${booking.customerName}*! 👋%0AConfirmamos tu reserva:%0A📅 ${booking.date} a las ${booking.time}hs%0A🏟 ${court?.name || 'Cancha'}%0A💰 $${booking.price}`;
    
    let phone = booking.customerPhone.replace(/[^0-9]/g, '');
    if (!phone) return alert("El cliente no tiene teléfono registrado");
    if (phone.length === 10) phone = '549' + phone;

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleEditClick = (booking: Booking) => {
      setEditingBooking(booking);
      setSelectedBooking(null); // Close details modal
      setIsFormModalOpen(true);
  };

  const handleFormSave = (booking: Booking) => {
      if (editingBooking) {
          onUpdateBooking(booking);
      } else {
          onAddBooking(booking);
      }
      setIsFormModalOpen(false);
      setEditingBooking(null);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>, booking: Booking) => {
      e.stopPropagation(); // Prevent card click
      const method = e.target.value as PaymentMethod | '';
      const updatedBooking = { 
          ...booking, 
          paymentMethod: method || undefined,
          // Optional: Auto-confirm if paid? Let's keep it manual as requested implies just setting payment.
      };
      onUpdateBooking(updatedBooking);
  };

  const getPaymentIcon = (method?: PaymentMethod) => {
      switch(method) {
          case PaymentMethod.CASH: return <Banknote size={12} />;
          case PaymentMethod.QR: return <QrCode size={12} />;
          case PaymentMethod.TRANSFER: return <CreditCard size={12} />;
          default: return <AlertCircle size={12} />;
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 h-full flex flex-col max-w-3xl mx-auto">
      
      {/* --- CONTROL BAR (Sticky) --- */}
      <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-30">
        
        {/* Date Navigator */}
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-white/5 w-full sm:w-auto">
             <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                 <ChevronLeft size={20}/>
             </button>
             <div className="flex-1 text-center px-6">
                 <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Viendo reservas del</div>
                 <div className="relative">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-white font-bold text-lg text-center outline-none w-full cursor-pointer appearance-none z-10 relative"
                    />
                 </div>
             </div>
             <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                 <ChevronRight size={20}/>
             </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
             <button 
                onClick={() => { setEditingBooking(null); setIsFormModalOpen(true); }}
                className={`flex-1 sm:flex-none ${theme.primary} hover:opacity-90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95`}
            >
                <Plus size={20} /> <span>Nuevo Turno</span>
            </button>
        </div>
      </div>

      {/* --- AGENDA VIEW: LIST OF CARDS --- */}
      <div className="flex-1 space-y-4">
          
          {dailyBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <CalendarDays size={48} className="mb-4 opacity-50"/>
                  <p className="text-lg font-medium">No hay reservas para este día.</p>
                  <button onClick={() => { setEditingBooking(null); setIsFormModalOpen(true); }} className="mt-4 text-blue-400 hover:text-blue-300 font-bold text-sm">
                      + Crear la primera
                  </button>
              </div>
          ) : (
              dailyBookings.map((booking, index) => {
                  const court = courts.find(c => c.id === booking.courtId);
                  const isConfirmed = booking.status === BookingStatus.CONFIRMED;
                  const hasPayment = !!booking.paymentMethod;

                  return (
                      <div 
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className={`
                            relative group overflow-hidden rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] shadow-md
                            ${isConfirmed 
                                ? 'bg-slate-800 border-l-4 border-l-green-500 border-y-white/5 border-r-white/5' 
                                : 'bg-slate-800 border-l-4 border-l-yellow-500 border-y-white/5 border-r-white/5'}
                        `}
                      >
                          <div className="flex items-stretch">
                              {/* Left: Time */}
                              <div className="w-20 sm:w-24 bg-slate-900/50 flex flex-col items-center justify-center p-2 sm:p-4 border-r border-white/5">
                                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">{booking.time}</span>
                                  <span className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">{booking.duration} min</span>
                              </div>

                              {/* Center: Details */}
                              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                      <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">{booking.customerName}</h3>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 text-sm text-slate-400 mb-1">
                                      <span className="flex items-center gap-1.5 text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">
                                         <MapPin size={10} /> {court?.name || 'Cancha ?'}
                                      </span>
                                  </div>

                                  <div className="flex items-center gap-3 mt-1 sm:mt-2">
                                      <span className="font-mono text-slate-300 font-bold bg-white/5 px-2 py-0.5 rounded text-xs border border-white/5">
                                          ${booking.price.toLocaleString()}
                                      </span>
                                      {booking.isRecurring && (
                                          <span className="flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                                              <RefreshCw size={10}/> Fijo
                                          </span>
                                      )}
                                  </div>
                              </div>

                              {/* Right: Actions Column (Payment & Status) */}
                              <div className="flex flex-col items-end justify-center p-3 sm:p-4 gap-2 border-l border-white/5 bg-white/[0.02] min-w-[110px]">
                                  
                                  {/* Payment Selector Button (PILL STYLE) */}
                                  <div 
                                    className={`relative px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/5 transition-colors w-full text-center
                                        ${hasPayment ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/30 text-slate-400'}
                                    `}
                                    onClick={(e) => e.stopPropagation()} 
                                  >
                                      {getPaymentIcon(booking.paymentMethod)}
                                      <span className="truncate">{booking.paymentMethod || 'Impago'}</span>
                                      
                                      {/* Invisible Select overlay for native functionality */}
                                      <select 
                                        value={booking.paymentMethod || ''}
                                        onChange={(e) => handlePaymentChange(e, booking)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer appearance-none"
                                      >
                                          <option value="">Marcar Impago</option>
                                          <option value={PaymentMethod.CASH}>Efectivo</option>
                                          <option value={PaymentMethod.QR}>QR Mercado Pago</option>
                                          <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                                      </select>
                                  </div>

                                  {/* Status Indicator (PILL STYLE) */}
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 w-full text-center
                                      ${isConfirmed ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}
                                  `}>
                                      {isConfirmed ? <Check size={12}/> : <Clock size={12}/>}
                                      {isConfirmed ? 'OK' : 'Pend.'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  );
              })
          )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isFormModalOpen && (
          <BookingFormModal 
            isOpen={isFormModalOpen} 
            onClose={() => { setIsFormModalOpen(false); setEditingBooking(null); }} 
            courts={courts}
            onSave={handleFormSave}
            initialDate={selectedDate}
            initialTime={'18:00'}
            editingBooking={editingBooking}
          />
      )}

      {/* --- DETAILS MODAL --- */}
      {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
                  <button onClick={() => setSelectedBooking(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X size={20}/></button>
                  
                  <div className="mb-6 border-b border-white/10 pb-4">
                      <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">Detalle del Turno</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <CalendarDays size={14}/> {selectedBooking.date}
                                <Clock size={14}/> {selectedBooking.time}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleEditClick(selectedBooking)}
                            className="p-2 bg-slate-800 rounded-lg text-blue-400 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                              <Edit2 size={18} />
                          </button>
                      </div>
                      <div className="mt-3 text-sm text-blue-400 font-bold flex items-center gap-1">
                        <MapPin size={14}/> {courts.find(c => c.id === selectedBooking.courtId)?.name}
                      </div>
                  </div>

                  <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                              <User size={20}/>
                          </div>
                          <div>
                              <div className="font-bold text-white">{selectedBooking.customerName}</div>
                              <div className="text-xs text-slate-400">{selectedBooking.customerPhone || 'Sin teléfono'}</div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                            <span className="text-slate-400 text-xs block mb-1">Estado</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold inline-block
                                ${selectedBooking.status === BookingStatus.CONFIRMED ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                            `}>
                                {selectedBooking.status}
                            </span>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                            <span className="text-slate-400 text-xs block mb-1">Precio</span>
                            <span className="font-mono font-bold text-white text-sm">${selectedBooking.price}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5 flex items-center justify-between">
                          <span className="text-slate-400 text-xs">Pago con</span>
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                              {getPaymentIcon(selectedBooking.paymentMethod)} {selectedBooking.paymentMethod || 'No registrado'}
                          </span>
                      </div>
                  </div>

                  <div className="space-y-3">
                       {selectedBooking.status === BookingStatus.PENDING && (
                           <button 
                                onClick={() => { onUpdateStatus(selectedBooking.id, BookingStatus.CONFIRMED); setSelectedBooking(null); }}
                                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                           >
                               <Check size={18}/> Confirmar Turno
                           </button>
                       )}
                       
                       <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => handleNotify(selectedBooking)} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm border border-white/5">
                               <MessageCircle size={16}/> WhatsApp
                           </button>
                           <button onClick={() => { onToggleRecurring(selectedBooking.id); setSelectedBooking(null); }} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm border border-white/5">
                               <RefreshCw size={16}/> {selectedBooking.isRecurring ? 'Quitar Fijo' : 'Hacer Fijo'}
                           </button>
                       </div>

                       <button 
                            onClick={() => { 
                                if(window.confirm('¿Seguro que deseas eliminar esta reserva?')) {
                                    onUpdateStatus(selectedBooking.id, BookingStatus.CANCELLED); 
                                    setSelectedBooking(null); 
                                }
                            }}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                       >
                           <Trash2 size={16}/> Eliminar Reserva
                       </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- INTERNAL COMPONENT: Add/Edit Booking Form ---
const BookingFormModal = ({ isOpen, onClose, courts, onSave, initialDate, initialTime, editingBooking }: any) => {
    const isEditMode = !!editingBooking;
    
    // Initial State Setup
    const defaultCourt = courts[0];
    const [form, setForm] = useState<Partial<Booking>>(
        isEditMode ? { ...editingBooking } : {
        customerName: '',
        customerPhone: '',
        date: initialDate,
        time: initialTime || '18:00',
        duration: 90,
        price: defaultCourt ? defaultCourt.basePrice : 0,
        courtId: defaultCourt ? defaultCourt.id : '',
        status: BookingStatus.PENDING, // Default to Pending now
        isRecurring: false,
        paymentMethod: undefined
    });

    const selectedCourt = courts.find((c: Court) => c.id === form.courtId);

    const handleCourtChange = (courtId: string) => {
        const court = courts.find((c: Court) => c.id === courtId);
        setForm({
            ...form,
            courtId,
            price: court ? court.basePrice : 0
        });
    };

    const applyPrice = (price: number) => {
        setForm(prev => ({ ...prev, price }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const bookingToSave: Booking = {
            ...form as Booking,
            id: isEditMode ? form.id : `b${Date.now()}`
        };
        onSave(bookingToSave);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {isEditMode ? <Edit2 size={20} className="text-blue-400"/> : <Plus size={20} className="text-blue-400"/>} 
                        {isEditMode ? 'Editar Turno' : 'Nuevo Turno'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 p-1 rounded-full"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                        </div>
                        <div>
                             <label className="text-xs text-slate-400 block mb-1">Hora</label>
                             <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Cancha</label>
                        <select value={form.courtId} onChange={e => handleCourtChange(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white">
                            {courts.map((c: Court) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* OFFERS SELECTION */}
                    {selectedCourt && (
                         <div className="space-y-2 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                            <label className="text-xs text-slate-400 font-bold block mb-1">Seleccionar Tarifa</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => applyPrice(selectedCourt.basePrice)}
                                    className={`text-xs p-2 rounded-lg border flex items-center justify-center gap-1 transition-all ${form.price === selectedCourt.basePrice ? 'bg-slate-700 border-white/30 text-white shadow-md' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
                                >
                                    Lista (${selectedCourt.basePrice})
                                </button>
                                
                                {selectedCourt.isOffer1Active && (
                                    <button 
                                        type="button"
                                        onClick={() => applyPrice(selectedCourt.offer1Price)}
                                        className={`text-xs p-2 rounded-lg border flex items-center justify-center gap-1 transition-all ${form.price === selectedCourt.offer1Price ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md' : 'bg-transparent border-purple-500/20 text-purple-400/70 hover:bg-purple-500/10'}`}
                                    >
                                        <Tag size={12}/> {selectedCourt.offer1Label || 'Oferta 1'} (${selectedCourt.offer1Price})
                                    </button>
                                )}

                                {selectedCourt.isOffer2Active && (
                                    <button 
                                        type="button"
                                        onClick={() => applyPrice(selectedCourt.offer2Price)}
                                        className={`text-xs p-2 rounded-lg border flex items-center justify-center gap-1 transition-all ${form.price === selectedCourt.offer2Price ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-md' : 'bg-transparent border-pink-500/20 text-pink-400/70 hover:bg-pink-500/10'}`}
                                    >
                                        <Percent size={12}/> {selectedCourt.offer2Label || 'Oferta 2'} (${selectedCourt.offer2Price})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase">Datos del Cliente</h4>
                        <div>
                            <input type="text" required placeholder="Nombre Completo" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                        </div>
                        <div>
                             <input type="tel" placeholder="Teléfono (Opcional)" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                        </div>
                    </div>

                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Precio Final</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                <input type="number" required value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 pl-6 text-white font-mono font-bold"/>
                            </div>
                        </div>
                         <div>
                             <label className="text-xs text-slate-400 block mb-1">Forma de Pago</label>
                             <select 
                                value={form.paymentMethod || ''} 
                                onChange={e => setForm({...form, paymentMethod: e.target.value as PaymentMethod})}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                             >
                                 <option value="">Seleccionar...</option>
                                 <option value={PaymentMethod.CASH}>Efectivo</option>
                                 <option value={PaymentMethod.QR}>QR Mercado Pago</option>
                                 <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                             </select>
                         </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg border border-white/10 w-full cursor-pointer hover:bg-slate-700 mt-2">
                        <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({...form, isRecurring: e.target.checked})} className="rounded bg-slate-900 border-white/20"/>
                        <span className="text-sm text-slate-300">Es Fijo Semanal</span>
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Save size={18} /> {isEditMode ? 'Guardar Cambios' : 'Crear Turno'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};