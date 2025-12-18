import React, { useState, useMemo } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Clock, MapPin, User, Phone, CheckCircle, X, AlertTriangle, MessageCircle, ChevronLeft, ChevronRight, Flame, Info } from 'lucide-react';
import { ClubConfig, Court, Booking, BookingStatus } from '../types';
import { COLOR_THEMES } from '../constants';

interface PublicBookingViewProps {
  config: ClubConfig;
  courts: Court[];
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
}

export const PublicBookingView: React.FC<PublicBookingViewProps> = ({ config, courts, bookings, onAddBooking }) => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string, time: string, price: number } | null>(null);
  const theme = COLOR_THEMES[config.courtColorTheme];
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const activeCourts = useMemo(() => courts.filter(c => c.status === 'AVAILABLE'), [courts]);
  const dayOfWeek = selectedDate.getDay(); 
  const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8:00 a 23:00

  const isSlotAvailable = (courtId: string, time: string) => {
      const timeNum = parseInt(time.split(':')[0]);
      const isOpen = config.schedule?.[dayOfWeek]?.[timeNum] ?? true;
      if (!isOpen) return false;
      return !bookings.some(b => b.date === dateStr && b.time === time && b.courtId === courtId && b.status !== BookingStatus.CANCELLED);
  };

  const getSlotPrice = (court: Court) => {
      // Lógica simple de precios (se puede expandir)
      if (court.isOffer1Active) return court.offer1Price;
      return court.basePrice;
  };

  const nextDates = useMemo(() => Array.from({length: 5}, (_, i) => addDays(new Date(), i)), []);

  return (
    <div className="min-h-screen bg-slate-950 pb-20 relative overflow-x-hidden">
      {/* Fondo Decorativo */}
      <div className={`fixed inset-0 bg-gradient-to-br ${theme.gradient} opacity-30 pointer-events-none`} />
      
      {/* Header Público Glass */}
      <header className="glass-panel sticky top-0 z-20 border-t-0 border-x-0 px-4 py-4 shadow-lg backdrop-blur-xl mb-6">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                  {config.logoUrl ? <img src={config.logoUrl} className="w-10 h-10 rounded-xl shadow-sm" alt="Logo"/> : <div className={`w-10 h-10 rounded-xl ${theme.primary} flex items-center justify-center shadow-lg`}><CalendarDays className="text-white"/></div>}
                  <div><h1 className="text-xl font-black text-white italic tracking-tighter">{config.name}</h1><p className="text-xs text-slate-300 font-medium">Reservas Online</p></div>
              </div>
          </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-6">
          
          {/* Banner Promo Glass */}
          {config.promoActive && (
            <div className="glass-panel p-4 rounded-2xl border-blue-500/30 relative overflow-hidden animate-in slide-in-from-top duration-700">
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.primary} opacity-10`}></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-blue-500/20 p-3 rounded-xl shrink-0 animate-pulse"><Flame className="text-blue-400" size={28} fill="currentColor"/></div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-wider mb-1">¡Promo Activa!</h3>
                        <p className="text-sm text-slate-200 font-medium leading-tight">{config.promoText}</p>
                        <p className="text-xs text-blue-300 mt-1 font-bold">Reserva 4 turnos seguidos por solo ${config.promoPrice}</p>
                    </div>
                </div>
            </div>
          )}
        
          {/* Selector de Fechas Glass */}
          <div className="glass-panel p-2 rounded-2xl flex items-center gap-2 overflow-x-auto scrollbar-hide">
             {nextDates.map(date => {
                 const isSelected = format(date, 'yyyy-MM-dd') === dateStr;
                 return (
                    <button key={date.toString()} onClick={() => setSelectedDate(date)} className={`flex-1 min-w-[80px] flex flex-col items-center p-3 rounded-xl transition-all ${isSelected ? `${theme.primary} text-white shadow-lg scale-[1.02] border border-white/20` : 'hover:bg-white/5 text-slate-400'}`}>
                        <span className="text-xs font-bold uppercase tracking-wider">{format(date, 'EEE', { locale: es })}</span>
                        <span className="text-2xl font-black leading-none mt-1">{format(date, 'dd')}</span>
                    </button>
                 )
             })}
          </div>

          {/* Grilla de Turnos Glass */}
          <div className="space-y-8">
            {activeCourts.map(court => {
                const price = getSlotPrice(court);
                return (
                <div key={court.id} className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <MapPin className={theme.accent} size={18}/>
                        <h3 className="text-white font-bold text-lg">{court.name}</h3>
                        <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{court.type === 'Indoor' ? 'Techada' : 'Descubierta'}</span>
                        <span className="text-xs font-mono text-green-400 ml-auto font-bold bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">${price}</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {hours.map(h => {
                            const time = `${h.toString().padStart(2, '0')}:00`;
                            const available = isSlotAvailable(court.id, time);
                            return (
                                <button key={time} disabled={!available} onClick={() => setSelectedSlot({ courtId: court.id, time, price })} className={`py-3 rounded-xl text-sm font-bold transition-all border flex flex-col items-center justify-center relative overflow-hidden group ${available ? `glass-panel hover:border-blue-500/50 hover:text-blue-300 cursor-pointer active:scale-95` : 'bg-slate-900/50 border-white/5 text-slate-600 opacity-50 cursor-not-allowed'}`}>
                                    {available ? <span className="flex items-center gap-1"><Clock size={14} className="group-hover:text-blue-400 transition-colors"/> {time}</span> : <span className="text-xs line-through">{time}</span>}
                                    {available && <div className={`absolute inset-0 bg-gradient-to-t ${theme.primary} opacity-0 group-hover:opacity-10 transition-opacity`}/>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )})}
          </div>
      </div>

      {/* --- MODAL DE CONFIRMACIÓN (El que se salía de los márgenes) --- */}
      {selectedSlot && (
        <BookingConfirmationModal 
            slot={selectedSlot} 
            court={courts.find(c => c.id === selectedSlot.courtId)!} 
            dateStr={dateStr}
            config={config}
            onClose={() => setSelectedSlot(null)}
            onConfirm={onAddBooking}
            theme={theme}
        />
      )}
    </div>
  );
};

// --- Componente del Modal Interno (Corregido para Móvil) ---
const BookingConfirmationModal = ({ slot, court, dateStr, config, onClose, onConfirm, theme }: any) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const handleWhatsAppRequest = () => {
        if (!customerName) return alert("Por favor, ingresa tu nombre.");
        const message = `Hola! 👋 Quiero solicitar un turno:%0A📅 Fecha: *${dateStr}*%0A⏰ Hora: *${slot.time}hs*%0A🏟 Cancha: *${court.name}*%0A👤 Nombre: *${customerName}*%0A💰 Precio: *$${slot.price}*`;
        let phone = config.ownerPhone?.replace(/[^0-9]/g, '') || '';
        if (phone && phone.length === 10) phone = '549' + phone;
        if (phone) window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        else alert("El club no tiene número de WhatsApp configurado.");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            {/* AQUÍ ESTÁ LA CLAVE: w-full max-w-md para que no se salga en móviles */}
            <div className="glass-panel w-full max-w-md rounded-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-top-4 duration-300">
                <div className={`h-2 w-full bg-gradient-to-r ${theme.primary}`}></div>
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 bg-white/5 rounded-full transition-colors"><X size={20}/></button>
                
                <div className="p-6">
                    <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2 mb-1"><Info size={22} className={theme.accent}/> Solicitar Reserva</h3>
                    <p className="text-sm text-slate-400 mb-6">Completa tus datos para enviar la solicitud.</p>

                    {/* Resumen del Turno */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 mb-6">
                        <div className="flex items-center gap-3"><CalendarDays className="text-slate-400" size={18}/><span className="text-white font-bold">{format(new Date(dateStr), 'EEEE dd/MM', {locale: es})}</span></div>
                        <div className="flex items-center gap-3"><Clock className="text-slate-400" size={18}/><span className="text-white font-bold text-lg">{slot.time} hs</span> <span className="text-slate-500 text-sm">(90 min)</span></div>
                        <div className="flex items-center gap-3"><MapPin className="text-slate-400" size={18}/><span className="text-white font-medium">{court.name}</span></div>
                        <div className="pt-3 border-t border-white/5 flex justify-between items-center"><span className="text-slate-400 text-sm font-bold uppercase">Valor del Turno</span><span className="text-2xl font-black text-green-400 font-mono">${slot.price}</span></div>
                    </div>

                    {/* Formulario */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5 ml-1">Tu Nombre Completo</label>
                            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="glass-input w-full rounded-xl py-3 pl-10" placeholder="Ej: Juan Pérez" /></div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5 ml-1">Tu Teléfono (Opcional)</label>
                            <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="glass-input w-full rounded-xl py-3 pl-10" placeholder="Ej: 3825..." /></div>
                        </div>
                    </div>
                    
                    <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/20 flex gap-3 items-start mb-6">
                        <AlertTriangle className="text-blue-400 shrink-0" size={20}/>
                        <p className="text-xs text-blue-200 leading-relaxed">La reserva se confirma únicamente al realizar el pago. Al solicitar, te contactaremos por WhatsApp para coordinar.</p>
                    </div>

                    <button onClick={handleWhatsAppRequest} disabled={!customerName} className={`w-full bg-gradient-to-r ${theme.primary} hover:opacity-90 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}>
                        <MessageCircle size={24} fill="currentColor" className="text-white"/> Solicitar por WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};
