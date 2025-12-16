
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Phone, CheckCircle, ArrowLeft, Calendar, Clock, MapPin, DollarSign, MessageCircle, Info, Sparkles, ExternalLink, Gift, Flame, Moon, Map } from 'lucide-react';
import { Court, Booking, ClubConfig, BookingStatus } from '../types';
import { COLOR_THEMES } from '../constants';

interface PublicBookingViewProps {
  config: ClubConfig;
  courts: Court[];
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
}

// --- HELPER TYPES ---
interface TimeSlot {
    time: string;       // "HH:mm" visual
    id: string;         // "HH:mm" or "HH:mm+1" for next day
    isNextDay: boolean;
    realDate: string;   // YYYY-MM-DD
}

// --- UTILS ---
const getArgentinaDate = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
};

const isTimeInPast = (slotDateStr: string, timeStr: string) => {
    const now = getArgentinaDate();
    const [h, m] = timeStr.split(':').map(Number);
    const [year, month, day] = slotDateStr.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day, h, m);
    // Buffer de 15 mins
    const bufferTime = new Date(now.getTime() + 15 * 60000);
    return slotDate < bufferTime;
};

export const PublicBookingView: React.FC<PublicBookingViewProps> = ({ config, courts, bookings, onAddBooking }) => {
  // STEPS: 'DATE' -> 'SLOTS' -> 'FORM' -> 'SUCCESS'
  const [step, setStep] = useState<'DATE' | 'SLOTS' | 'FORM' | 'SUCCESS'>('DATE');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]); // Array of IDs (e.g. "23:00", "00:00+1")
  const [customerData, setCustomerData] = useState({ name: '', phone: '' });

  // ADS STATE
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const activeAds = useMemo(() => config.ads.filter(ad => ad.isActive), [config.ads]);

  const theme = COLOR_THEMES[config.courtColorTheme];

  // --- LOGIC ---

  // Ads Rotation Effect
  useEffect(() => {
      if (activeAds.length <= 1) return;
      const interval = setInterval(() => {
          setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
      }, (config.adRotationInterval || 5) * 1000);
      return () => clearInterval(interval);
  }, [activeAds, config.adRotationInterval]);

  const handleDateChange = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedSlotIds([]);
  };

  // --- GENERATE SMART SLOTS ---
  const generatedSlots = useMemo(() => {
      const slots: TimeSlot[] = [];
      const baseDateObj = new Date(selectedDate + 'T12:00:00'); // Safe middle of day
      const nextDateObj = new Date(baseDateObj);
      nextDateObj.setDate(nextDateObj.getDate() + 1);
      const nextDateStr = nextDateObj.toISOString().split('T')[0];

      const getConfigDayIndex = (date: Date) => {
          const jsDay = date.getDay(); // 0(Sun) - 6(Sat)
          return jsDay === 0 ? 6 : jsDay - 1;
      };

      const todayIndex = getConfigDayIndex(baseDateObj);
      const nextDayIndex = getConfigDayIndex(nextDateObj);

      // Today's Slots (08:00 to 23:30)
      for (let h = 8; h < 24; h++) {
          if (config.schedule[todayIndex]?.[h]) {
              const hStr = h.toString().padStart(2, '0');
              slots.push({ time: `${hStr}:00`, id: `${hStr}:00`, isNextDay: false, realDate: selectedDate });
              slots.push({ time: `${hStr}:30`, id: `${hStr}:30`, isNextDay: false, realDate: selectedDate });
          }
      }

      // Next Day Early Morning Slots (00:00 to 05:00)
      for (let h = 0; h < 6; h++) {
           if (config.schedule[nextDayIndex]?.[h]) {
              const hStr = h.toString().padStart(2, '0');
              slots.push({ time: `${hStr}:00`, id: `${hStr}:00+1`, isNextDay: true, realDate: nextDateStr });
              slots.push({ time: `${hStr}:30`, id: `${hStr}:30+1`, isNextDay: true, realDate: nextDateStr });
           }
      }

      return slots;
  }, [selectedDate, config.schedule]);


  // Check availability
  const getFreeCourtsForSlot = (slot: TimeSlot): Court[] => {
      if (isTimeInPast(slot.realDate, slot.time)) return [];

      const slotDate = new Date(`${slot.realDate}T${slot.time}`);

      return courts.filter(court => {
          if (court.status === 'MAINTENANCE') return false;

          const hasBooking = bookings.some(b => {
             if (b.courtId !== court.id) return false;
             if (b.status === BookingStatus.CANCELLED) return false;
             
             // Simple string date match first for optimization
             if (b.date !== slot.realDate) {
                 const bStart = new Date(`${b.date}T${b.time}`);
                 const bEnd = new Date(bStart.getTime() + b.duration * 60000);
                 const slotEnd = new Date(slotDate.getTime() + 30 * 60000);
                 return bStart < slotEnd && bEnd > slotDate;
             }

             const bStart = new Date(`${b.date}T${b.time}`);
             const bEnd = new Date(bStart.getTime() + b.duration * 60000);
             const slotEnd = new Date(slotDate.getTime() + 30 * 60000);

             return bStart < slotEnd && bEnd > slotDate;
          });

          return !hasBooking;
      });
  };

  const toggleSlotSelection = (slotId: string) => {
      if (selectedSlotIds.includes(slotId)) {
          setSelectedSlotIds(prev => prev.filter(id => id !== slotId));
      } else {
          // Special sorting because IDs might have "+1"
          const newIds = [...selectedSlotIds, slotId];
          const sortedIds = generatedSlots
            .filter(s => newIds.includes(s.id))
            .map(s => s.id);
            
          setSelectedSlotIds(sortedIds);
      }
  };

  // --- PROMO LOGIC & PRICE ---
  const checkPromoEligibility = () => {
      if (!config.promoActive || selectedSlotIds.length !== 4) return { eligible: false, court: null };

      const selectedSlots = generatedSlots.filter(s => selectedSlotIds.includes(s.id));
      if (selectedSlots.length !== 4) return { eligible: false, court: null };

      // Verify Continuity
      for (let i = 0; i < selectedSlots.length - 1; i++) {
          const current = new Date(`${selectedSlots[i].realDate}T${selectedSlots[i].time}`);
          const next = new Date(`${selectedSlots[i+1].realDate}T${selectedSlots[i+1].time}`);
          const diffMinutes = (next.getTime() - current.getTime()) / 60000;
          if (diffMinutes !== 30) return { eligible: false, court: null };
      }

      // Find common court
      const initialFreeCourts = getFreeCourtsForSlot(selectedSlots[0]);
      
      for (const candidateCourt of initialFreeCourts) {
          let isFullBlockFree = true;
          for (let i = 1; i < 4; i++) {
              const freeC = getFreeCourtsForSlot(selectedSlots[i]);
              if (!freeC.find(c => c.id === candidateCourt.id)) {
                  isFullBlockFree = false;
                  break;
              }
          }
          if (isFullBlockFree) return { eligible: true, court: candidateCourt };
      }

      return { eligible: false, court: null };
  };

  const promoStatus = checkPromoEligibility();

  const calculateTotal = () => {
      if (promoStatus.eligible && config.promoActive) {
          return config.promoPrice;
      }

      let total = 0;
      selectedSlotIds.forEach(id => {
          const slot = generatedSlots.find(s => s.id === id);
          if (slot) {
              const freeCourts = getFreeCourtsForSlot(slot);
              if (freeCourts.length > 0) {
                  total += (freeCourts[0].basePrice / 3);
              }
          }
      });
      return Math.round(total / 100) * 100;
  };

  const totalPrice = calculateTotal();
  const totalDurationMinutes = selectedSlotIds.length * 30;

  const formatDuration = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return `${h}h ${m}min`;
      if (h > 0) return `${h} hs`;
      return `${m} min`;
  };

  const handleConfirmBooking = () => {
      if (selectedSlotIds.length === 0) return;
      
      const startSlotId = selectedSlotIds[0];
      const startSlot = generatedSlots.find(s => s.id === startSlotId);
      if (!startSlot) return;

      let assignedCourt: Court | null = null;

      if (promoStatus.eligible) {
          assignedCourt = promoStatus.court;
      } else {
          const free = getFreeCourtsForSlot(startSlot);
          if (free.length > 0) assignedCourt = free[0];
      }

      if (!assignedCourt) return alert("Error: El horario ya no está disponible.");
      
      const newBooking: Booking = {
          id: `web-${Date.now()}`,
          courtId: assignedCourt.id,
          date: startSlot.realDate,
          time: startSlot.time,
          duration: totalDurationMinutes,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          status: BookingStatus.PENDING,
          price: totalPrice,
          isRecurring: false
      };
      
      onAddBooking(newBooking);
      setStep('SUCCESS');

      const clubPhone = config.ownerPhone.replace('+', '');
      let promoText = "";
      if (promoStatus.eligible) {
          promoText = `%0A🎁 *PROMO ACTIVADA:* ${config.promoText}`;
      }

      const msg = `Hola! Quiero confirmar una reserva en *${config.name}* 🎾%0A%0A👤 *Cliente:* ${customerData.name}%0A📱 *Tel:* ${customerData.phone}%0A📅 *Fecha:* ${startSlot.realDate}%0A⏰ *Hora:* ${startSlot.time} (${formatDuration(totalDurationMinutes)})%0A🏟 *Cancha:* ${assignedCourt.name}${promoText}%0A💰 *Total:* $${totalPrice.toLocaleString()}`;
      
      setTimeout(() => {
          window.open(`https://wa.me/${clubPhone}?text=${msg}`, '_blank');
      }, 1000);
  };

  // --- RENDER HELPERS ---
  const todaySlots = generatedSlots.filter(s => !s.isNextDay);
  const nextDaySlots = generatedSlots.filter(s => s.isNextDay);
  const nextDayDate = nextDaySlots.length > 0 ? nextDaySlots[0].realDate : '';

  const renderSlotButton = (slot: TimeSlot) => {
      const freeCourts = getFreeCourtsForSlot(slot);
      const isAvailable = freeCourts.length > 0;
      const isSelected = selectedSlotIds.includes(slot.id);

      return (
          <button
              key={slot.id}
              disabled={!isAvailable}
              onClick={() => toggleSlotSelection(slot.id)}
              className={`
                  relative h-16 w-full rounded-xl text-sm font-bold transition-all border flex flex-col items-center justify-center
                  ${isSelected 
                      ? `${theme.primary} text-white border-white/30 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105 z-10` 
                      : isAvailable 
                          ? slot.isNextDay
                              ? 'bg-slate-800/40 text-slate-300 border-white/5 hover:bg-slate-700/60 hover:border-white/20 hover:text-white'
                              : 'bg-slate-800/60 text-white border-white/10 hover:bg-slate-700 hover:border-white/30'
                          : 'bg-slate-900/20 text-slate-800 border-transparent opacity-30 cursor-not-allowed'}
              `}
          >
              <span className="tracking-tight text-base">{slot.time}</span>
              {isSelected && (
                  <div className="absolute top-1 right-1">
                      <CheckCircle size={12} className="text-white/70"/>
                  </div>
              )}
          </button>
      );
  };

  const renderAd = () => {
    if (activeAds.length === 0) return null;
    return (
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group animate-in fade-in duration-700 mt-auto">
            <img 
                src={activeAds[currentAdIndex].imageUrl} 
                alt="Publicidad" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md text-[10px] text-white/70 px-2 py-0.5 rounded-md border border-white/10">
                Publicidad
            </div>
            {activeAds[currentAdIndex].linkUrl && (
                <a 
                    href={activeAds[currentAdIndex].linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 rounded-full border border-white/20 transition-all active:scale-95"
                >
                    <ExternalLink size={16}/>
                </a>
            )}
            {activeAds.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {activeAds.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentAdIndex ? 'bg-white w-3' : 'bg-white/40'}`}/>
                    ))}
                </div>
            )}
        </div>
    );
  };

  if (step === 'SUCCESS') {
      return (
          <div 
            className="h-full flex items-center justify-center p-6 bg-cover bg-center relative animate-in fade-in"
            style={{ backgroundImage: config.bookingBackgroundImage ? `url(${config.bookingBackgroundImage})` : undefined }}
          >
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"></div>
              
              <div className="relative z-10 max-w-sm w-full bg-white/5 border border-white/20 p-8 rounded-3xl shadow-2xl text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-in zoom-in spin-in-12">
                      <CheckCircle size={40} className="text-white" strokeWidth={3}/>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">¡Reserva Enviada!</h2>
                  <p className="text-slate-300 mb-8 leading-relaxed text-sm">
                      Tu solicitud ha ingresado al sistema. <br/>
                      <span className="text-green-400 font-bold">Se abrirá WhatsApp para finalizar la confirmación.</span>
                  </p>
                  <button 
                    onClick={() => {
                        setStep('DATE');
                        setSelectedSlotIds([]);
                        setCustomerData({name: '', phone: ''});
                    }}
                    className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-transform active:scale-95"
                  >
                      Nueva Reserva
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div 
        className="h-full flex flex-col bg-slate-950 relative overflow-hidden font-sans"
        style={{ 
            backgroundImage: config.bookingBackgroundImage ? `url(${config.bookingBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}
    >
        {/* Dark Overlay with Blur */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"></div>

        {/* --- MAIN RESPONSIVE CONTAINER --- */}
        <div className="relative z-10 flex-1 flex flex-col h-full md:p-6 md:items-center md:justify-center overflow-hidden">
            <div className="flex-1 w-full max-w-lg md:max-w-6xl md:max-h-[85vh] bg-slate-900/40 md:bg-slate-900/80 md:border md:border-white/10 md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden backdrop-blur-md">
                
                {/* --- SIDEBAR (DESKTOP ONLY) --- */}
                <div className="hidden md:flex w-1/3 border-r border-white/10 flex-col p-8 bg-black/20">
                     <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-xl border border-white/10 bg-slate-800">
                         {config.logoUrl ? (
                             <img src={config.logoUrl} className="w-full h-full object-cover"/>
                         ) : (
                             <div className={`w-full h-full ${theme.primary} flex items-center justify-center text-white font-bold text-3xl`}>{config.name.charAt(0)}</div>
                         )}
                     </div>
                     <h1 className="text-2xl font-bold text-white tracking-tight mb-1">{config.name}</h1>
                     <div className="flex items-center gap-2 text-slate-400 text-sm mb-8">
                         <MapPin size={14}/> <span>Reserva de Padel Online</span>
                     </div>

                     {/* Desktop Selection Summary */}
                     <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha</label>
                             <div className="text-white font-bold text-lg flex items-center gap-2">
                                 <Calendar size={18} className="text-blue-400"/> {selectedDate}
                             </div>
                         </div>
                         {selectedSlotIds.length > 0 && (
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selección</label>
                                <div className="text-white font-bold text-lg flex items-center gap-2">
                                    <Clock size={18} className="text-blue-400"/> {formatDuration(totalDurationMinutes)}
                                </div>
                             </div>
                         )}
                     </div>
                     
                     {/* Desktop Ads placement at bottom */}
                     {renderAd()}
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    
                    {/* MOBILE HEADER */}
                    <div className="md:hidden p-6 pb-2 flex flex-col items-center justify-center relative shrink-0">
                        {step !== 'DATE' && (
                            <button 
                                onClick={() => setStep(step === 'FORM' ? 'SLOTS' : 'DATE')} 
                                className="absolute left-6 top-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                                <ArrowLeft size={20}/>
                            </button>
                        )}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 shadow-xl border border-white/10 bg-slate-800">
                            {config.logoUrl ? (
                                <img src={config.logoUrl} className="w-full h-full object-cover"/>
                            ) : (
                                <div className={`w-full h-full ${theme.primary} flex items-center justify-center text-white font-bold text-3xl`}>{config.name.charAt(0)}</div>
                            )}
                        </div>
                        <h1 className="text-lg font-bold text-white tracking-tight text-center">{config.name}</h1>
                    </div>

                    {/* CONTENT SCROLLABLE */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
                        
                        {/* VIEW: DATE PICKER */}
                        {step === 'DATE' && (
                            <div className="h-full flex flex-col p-6 md:p-10 animate-in slide-in-from-right-8 duration-300">
                                <div className="text-center md:text-left mb-6">
                                    <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
                                    <p className="text-slate-400 text-sm mt-1">Selecciona el día para jugar</p>
                                </div>

                                {/* Date Picker */}
                                <div className="bg-slate-800/60 p-1 rounded-2xl border border-white/10 flex items-center justify-between mb-6 md:max-w-md">
                                    <button onClick={() => handleDateChange(-1)} className="p-4 hover:bg-white/10 rounded-xl text-white transition-colors"><ChevronLeft/></button>
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">FECHA SELECCIONADA</div>
                                        <input 
                                            type="date" 
                                            value={selectedDate}
                                            onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlotIds([]); }}
                                            className="bg-transparent text-xl font-bold text-white text-center w-full focus:outline-none appearance-none cursor-pointer font-mono"
                                        />
                                    </div>
                                    <button onClick={() => handleDateChange(1)} className="p-4 hover:bg-white/10 rounded-xl text-white transition-colors"><ChevronRight/></button>
                                </div>

                                <button 
                                    onClick={() => setStep('SLOTS')}
                                    className={`w-full md:max-w-md mb-4 ${theme.primary} text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2`}
                                >
                                    <Clock size={20}/> Ver Horarios Disponibles
                                </button>
                                
                                {/* Mobile Ad Placeholder */}
                                <div className="md:hidden flex-1 flex flex-col justify-end">
                                    {renderAd()}
                                </div>
                            </div>
                        )}

                        {/* VIEW: SLOTS GRID */}
                        {step === 'SLOTS' && (
                            <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                                {/* Desktop Header for Slots */}
                                <div className="hidden md:flex px-8 py-6 justify-between items-center border-b border-white/5">
                                    <h2 className="text-2xl font-bold text-white">Horarios Disponibles</h2>
                                    <button onClick={() => setStep('DATE')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
                                        Cambiar Fecha <ChevronRight size={14}/>
                                    </button>
                                </div>

                                {/* Mobile Info Header */}
                                <div className="md:hidden px-6 py-2 flex justify-between items-center bg-white/5 border-y border-white/5">
                                    <span className="text-white font-bold flex items-center gap-2"><Calendar size={16}/> {selectedDate}</span>
                                    <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-md border border-blue-500/20">30m</span>
                                </div>

                                <div className="p-6 md:p-8 overflow-y-auto content-start pb-24">
                                    {generatedSlots.length === 0 && (
                                        <div className="text-center py-10 text-slate-400">
                                            <Moon size={40} className="mx-auto mb-2 opacity-50"/>
                                            No hay turnos disponibles.
                                        </div>
                                    )}

                                    {/* TODAY SLOTS - Responsive Grid */}
                                    {todaySlots.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                            {todaySlots.map(slot => renderSlotButton(slot))}
                                        </div>
                                    )}
                                    
                                    {/* NEXT DAY SLOTS */}
                                    {nextDaySlots.length > 0 && (
                                        <>
                                            <div className="py-6 flex items-center gap-4">
                                                <div className="h-px bg-white/10 flex-1"></div>
                                                <span className="text-xs font-bold text-slate-400 bg-slate-900/40 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                                                    <Calendar size={12}/> {nextDayDate}
                                                </span>
                                                <div className="h-px bg-white/10 flex-1"></div>
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                                {nextDaySlots.map(slot => renderSlotButton(slot))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* VIEW: FORM */}
                        {step === 'FORM' && (
                             <div className="h-full p-6 md:p-10 animate-in slide-in-from-right-8 duration-300 flex flex-col md:max-w-lg md:mx-auto">
                                 <button onClick={() => setStep('SLOTS')} className="hidden md:flex mb-6 text-slate-400 hover:text-white items-center gap-2">
                                     <ArrowLeft size={18}/> Volver a horarios
                                 </button>
                                 <h3 className="text-lg font-bold text-white mb-6 text-center md:text-left">Datos de Contacto</h3>
                                 
                                 <div className="space-y-4 flex-1">
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombre y Apellido</label>
                                         <div className="relative mt-1">
                                             <User className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                                             <input 
                                                 type="text" 
                                                 required
                                                 value={customerData.name}
                                                 onChange={e => setCustomerData({...customerData, name: e.target.value})}
                                                 className="w-full bg-slate-800/80 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                 placeholder="Ej: Leo Messi"
                                             />
                                         </div>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Teléfono (WhatsApp)</label>
                                         <div className="relative mt-1">
                                             <Phone className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                                             <input 
                                                 type="tel" 
                                                 required
                                                 value={customerData.phone}
                                                 onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                                                 className="w-full bg-slate-800/80 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                 placeholder="11 1234 5678"
                                             />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        )}
                    </div>

                    {/* FOOTER SUMMARY */}
                    {step !== 'DATE' && (
                        <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-4 shrink-0 safe-area-bottom z-20">
                            {promoStatus.eligible && (
                                <div className="mb-3 flex items-center gap-2 justify-center text-xs font-bold text-orange-300 animate-pulse">
                                    <Flame size={14}/> <span>{config.promoText || 'Promo Activada'}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-4 md:max-w-4xl md:mx-auto">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Total ({formatDuration(totalDurationMinutes)})</span>
                                    <span className="text-xl font-bold text-white flex items-baseline gap-1">
                                        ${totalPrice.toLocaleString()}
                                        {promoStatus.eligible && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 rounded ml-1 border border-red-500/30">PROMO</span>}
                                    </span>
                                </div>
                                
                                <button 
                                    onClick={() => step === 'SLOTS' ? setStep('FORM') : handleConfirmBooking()}
                                    disabled={selectedSlotIds.length === 0 || (step === 'FORM' && (!customerData.name || !customerData.phone))}
                                    className={`
                                        px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
                                        ${selectedSlotIds.length > 0 
                                            ? (promoStatus.eligible ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:brightness-110 active:scale-95' : `${theme.primary} hover:opacity-90 active:scale-95`) 
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                    `}
                                >
                                    {step === 'SLOTS' ? (
                                        <>Siguiente <ChevronRight size={18}/></>
                                    ) : (
                                        <>Confirmar <MessageCircle size={18}/></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
