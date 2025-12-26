
import React, { useMemo } from 'react';
import { Quote, ItemType, ItineraryItem, Library, MasterItem } from '../types';
import { Plane, Hotel, TentTree, Car, Sparkles, MapPin, Calendar, ArrowLeft, Download, CheckSquare, X, Users, Info, Map, BedDouble, Utensils, Briefcase, User, Layers, Clock, Phone } from 'lucide-react';

interface QuotePreviewProps {
  quote: Quote;
  library: Library;
  onBack: () => void;
}

const QuotePreview: React.FC<QuotePreviewProps> = ({ quote, library, onBack }) => {
  
  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'flight': return <Plane size={18} className="text-brand-600" />;
      case 'hotel': return <Hotel size={18} className="text-brand-600" />;
      case 'activity': return <TentTree size={18} className="text-brand-600" />;
      case 'transfer': return <Car size={18} className="text-brand-600" />;
      default: return <Sparkles size={18} className="text-brand-600" />;
    }
  };

  const handlePrint = () => window.print();

  const formattedProposalDate = useMemo(() => {
    if (!quote.startDate) return '';
    const date = new Date(quote.startDate);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [quote.startDate]);

  const travelersSummary = useMemo(() => {
    const { adults, children, infants } = quote.client.travelers;
    let summary = `${adults} Adult(s)`;
    if (children > 0) summary += `, ${children} Child(ren)`;
    if (infants > 0) summary += `, ${infants} Infant(s)`;
    return summary;
  }, [quote.client.travelers]);

  const groupedItems = useMemo(() => {
    const groups: Record<number, ItineraryItem[]> = {};
    const sorted = [...quote.items].sort((a, b) => a.day - b.day);
    sorted.forEach(item => {
      if (!groups[item.day]) groups[item.day] = [];
      groups[item.day].push(item);
    });
    return groups;
  }, [quote.items]);

  const getDateForDay = (dayNum: number) => {
    if (!quote.startDate) return '';
    const date = new Date(quote.startDate);
    date.setDate(date.getDate() + (dayNum - 1));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getMealPlanForDay = (dayNum: number, items: ItineraryItem[]) => {
    if (dayNum === 1) return "N/A";
    let hasLunch = false;
    let hasDinner = false;
    items.forEach(item => {
      const content = (item.title + " " + item.description).toLowerCase();
      if (content.includes("lunch")) hasLunch = true;
      if (content.includes("dinner")) hasDinner = true;
    });
    const meals = ["Breakfast"];
    if (hasLunch) meals.push("Lunch");
    if (hasDinner) meals.push("Dinner");
    if (meals.length === 1) return meals[0];
    if (meals.length === 2) return `${meals[0]} & ${meals[1]}`;
    return `${meals[0]}, ${meals[1]} & ${meals[2]}`;
  };

  const smartInclusions = useMemo(() => {
    const all = new Set<string>(quote.inclusions);
    quote.items
      .filter(item => item.type !== 'flight')
      .forEach(item => item.inclusions?.forEach(inc => all.add(inc)));
    return Array.from(all).filter(Boolean);
  }, [quote.inclusions, quote.items]);

  const smartExclusions = useMemo(() => {
    const all = new Set<string>(quote.exclusions);
    quote.items
      .filter(item => item.type !== 'flight')
      .forEach(item => item.exclusions?.forEach(exc => all.add(exc)));
    return Array.from(all).filter(Boolean);
  }, [quote.exclusions, quote.items]);

  const pricingBreakdown = useMemo(() => {
    const { adults, children, infants } = quote.client.travelers;
    const breakdown = [
      { label: 'Adults', count: adults, rate: quote.pricePerAdult, total: adults * quote.pricePerAdult, unit: 'pax' }
    ];
    if (children > 0) breakdown.push({ label: 'Children', count: children, rate: quote.pricePerChild, total: children * quote.pricePerChild, unit: 'pax' });
    if (infants > 0) breakdown.push({ label: 'Infants', count: infants, rate: quote.pricePerInfant, total: infants * quote.pricePerInfant, unit: 'pax' });
    if ((quote.baggagePcs || 0) > 0) {
      breakdown.push({ label: 'Baggage', count: quote.baggagePcs || 0, rate: quote.baggageRate || 0, total: (quote.baggagePcs || 0) * (quote.baggageRate || 0), unit: 'Qty' });
    }
    if (quote.extraTitle && (quote.extraPax || 0) > 0) {
      breakdown.push({ label: quote.extraTitle, count: quote.extraPax || 0, rate: quote.extraRate || 0, total: (quote.extraPax || 0) * (quote.extraRate || 0), unit: 'Qty' });
    }
    return breakdown;
  }, [quote.client.travelers, quote.pricePerAdult, quote.pricePerChild, quote.pricePerInfant, quote.baggagePcs, quote.baggageRate, quote.extraTitle, quote.extraPax, quote.extraRate]);

  const calculatedTotal = useMemo(() => {
    return pricingBreakdown.reduce((sum, item) => sum + item.total, 0);
  }, [pricingBreakdown]);

  const getHotelsForDay = (dayItems: ItineraryItem[]) => {
    const citiesOnDay = Array.from(new Set(dayItems
      .filter(i => i.type !== 'hotel')
      .map(i => i.city?.trim().toLowerCase())
      .filter(Boolean)
    ));
    if (citiesOnDay.length === 0) return [];
    const fromLibrary = (library.hotels || []).filter(h => 
      h.city && citiesOnDay.includes(h.city.trim().toLowerCase())
    );
    const fromQuote = quote.items.filter(i => 
      i.type === 'hotel' && i.city && citiesOnDay.includes(i.city.trim().toLowerCase())
    );
    const seen = new Set();
    return [...fromLibrary, ...fromQuote].filter(h => {
      const key = `${h.title}-${h.city}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen py-4 md:py-10 selection:bg-brand-100">
      <div className="max-w-4xl mx-auto mb-4 md:mb-6 px-4 flex justify-between items-center no-print">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors bg-white px-3 md:px-4 py-2 rounded-lg shadow-sm font-medium text-xs md:text-sm border"
        >
          <ArrowLeft size={16} /> <span className="hidden xs:inline">Editor</span>
        </button>
        <button 
          onClick={handlePrint} 
          className="bg-brand-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-brand-700 transition-all flex items-center gap-2 font-bold shadow-md active:scale-95 text-xs md:text-sm"
        >
          <Download size={16} /> <span className="hidden xs:inline">Download Quote</span><span className="xs:hidden">PDF</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-none md:rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Simplified Header with Company Logo & Contact */}
        <div className="bg-brand-50 text-slate-900 p-6 md:p-12 relative overflow-hidden border-b border-brand-100">
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 pointer-events-none text-brand-900 hidden md:block">
             <Map size={240} />
          </div>
          <div className="relative z-10">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 md:mb-10">
               <div className="flex items-center gap-4">
                  <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white p-1.5 shadow-sm border border-brand-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://mysimrik.com/simrik_gallery/2025/11/adventure-logo-square-scaled.png" 
                      alt="Simrik Adventures" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-xl md:text-2xl font-serif font-black tracking-tight uppercase text-brand-900 leading-tight truncate">Simrik Adventures</h3>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[8px] md:text-[10px] font-bold text-brand-700 uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin size={10} /> Lazimpat, Kathmandu
                      </p>
                      <p className="text-[8px] md:text-[10px] font-bold text-brand-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Phone size={10} /> 01-4547009
                      </p>
                    </div>
                  </div>
               </div>
               <div className="md:text-right flex flex-col items-start md:items-end gap-1">
                 {quote.generatedBy && (
                   <div className="bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-brand-100">
                     <p className="text-[8px] uppercase tracking-[0.2em] text-brand-400 font-black">Consultant</p>
                     <p className="text-[10px] md:text-xs font-bold text-slate-800">{quote.generatedBy}</p>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="space-y-1">
               <h2 className="text-brand-600 font-black tracking-widest uppercase text-[8px] md:text-[10px]">Exclusive Travel Proposal</h2>
               <h1 className="text-2xl md:text-4xl font-serif font-bold leading-tight max-w-2xl text-slate-900">
                 {quote.title || `Journey to ${quote.destination}`}
               </h1>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 p-6 md:p-12 border-b">
           {/* Left Column: Guest & Trip Overview */}
           <div className="space-y-8 md:space-y-10">
              <div className="space-y-2">
                 <h3 className="text-slate-400 font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em] flex items-center gap-2">
                   <User size={12} /> Prepared For
                 </h3>
                 <div>
                    <p className="text-xl md:text-2xl font-serif font-bold text-slate-900">{quote.client.name}</p>
                    <p className="text-slate-500 font-medium text-xs md:text-sm">{quote.client.email}</p>
                 </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                 <h3 className="text-slate-400 font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em] flex items-center gap-2 mb-2">
                   <Info size={12} /> Trip Overview
                 </h3>
                 <div className="space-y-2.5">
                   <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-700">
                     <MapPin size={14} className="text-brand-600 shrink-0" />
                     <span>Destination: <span className="text-brand-800 ml-1">{quote.destination}</span></span>
                   </div>
                   <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-700">
                     <Calendar size={14} className="text-brand-600 shrink-0" />
                     <span>Period: <span className="text-brand-800 ml-1">{formattedProposalDate} onwards</span></span>
                   </div>
                   <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-700">
                     <Users size={14} className="text-brand-600 shrink-0" />
                     <span>Guest(s): <span className="text-brand-800 ml-1">{travelersSummary}</span></span>
                   </div>
                 </div>
              </div>
           </div>

           {/* Right Column: Costing & Breakdown */}
           <div className="md:text-right space-y-4 md:space-y-6">
              <div className="space-y-1">
                <h3 className="text-slate-400 font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em]">Price Summary</h3>
                <p className="text-4xl md:text-6xl font-black text-brand-600 tracking-tighter">
                   <span className="text-sm md:text-xl font-normal text-slate-400 mr-1.5">{quote.currency}</span>
                   {calculatedTotal.toLocaleString()}
                </p>
              </div>

              <div className="inline-block text-left bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100 w-full shadow-inner">
                 <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Rate Breakdown</p>
                 <table className="w-full text-left border-collapse">
                   <tbody className="divide-y divide-slate-200/60">
                     {pricingBreakdown.map((row, i) => (
                       <tr key={i} className="text-[10px] md:text-[11px]">
                         <td className="py-1.5 font-black text-slate-800">{row.label}</td>
                         <td className="py-1.5 text-slate-500 font-bold px-2 text-center">
                            {row.count} <span className="text-[8px] text-brand-600 uppercase font-black">{row.unit}</span>
                         </td>
                         <td className="py-1.5 text-slate-400 font-medium whitespace-nowrap">@ {row.rate.toLocaleString()}</td>
                         <td className="py-1.5 text-right font-black text-slate-900 whitespace-nowrap pl-2">{quote.currency} {row.total.toLocaleString()}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="p-6 md:p-12 space-y-8 md:space-y-12">
          <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
             <Map className="text-brand-600" /> Planned Itinerary
          </h3>

          <div className="space-y-12 md:space-y-16">
            {Object.keys(groupedItems).sort((a,b)=>parseInt(a)-parseInt(b)).map((dayStr) => {
              const day = parseInt(dayStr);
              const items = groupedItems[day];
              const matchedHotels = getHotelsForDay(items);
              const mealPlan = getMealPlanForDay(day, items);

              return (
                <div key={day} className="relative pl-6 md:pl-8 border-l-2 border-slate-100 pb-2">
                  <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-brand-600 border-4 border-white shadow-sm"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h4 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-3">
                      Day {day} ({getDateForDay(day)})
                    </h4>
                    <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 px-3 py-1 rounded-lg w-fit">
                      <Utensils size={12} className="text-brand-600" />
                      <span className="text-[8px] md:text-[10px] font-black text-brand-700 uppercase tracking-widest">{mealPlan}</span>
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                    {matchedHotels.length > 0 && (
                      <div className="bg-brand-50/50 rounded-xl p-3 md:p-4 border border-brand-100 flex flex-col gap-2">
                        <p className="text-[8px] md:text-[10px] font-bold text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
                          <BedDouble size={12} /> Proposed Stay
                        </p>
                        {matchedHotels.map((hotel, idx) => (
                          <div key={idx} className="flex flex-col">
                            <h5 className="font-bold text-slate-800 text-xs md:text-sm">{hotel.title}</h5>
                          </div>
                        ))}
                      </div>
                    )}

                    {items.filter(i => i.type !== 'hotel').map((item, idx) => (
                      <div key={item.id} className="group">
                        <div className="flex gap-3 md:gap-4">
                           <div className="mt-1 w-9 h-9 md:w-10 md:h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-brand-50 transition-colors">
                             {getItemIcon(item.type)}
                           </div>
                           <div className="flex-1 space-y-1.5">
                             <div className="flex items-baseline justify-between gap-4">
                               <h5 className="font-bold text-slate-900 text-base md:text-lg leading-tight">
                                 {item.time && <span className="text-brand-600 text-xs md:text-sm mr-2">{item.time}</span>}
                                 {item.title}
                               </h5>
                             </div>
                             <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                               {item.description}
                             </p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {quote.baggageDetails && (
          <div className="p-6 md:p-12 border-t bg-slate-50/50">
            <h3 className="text-lg md:text-xl font-serif font-bold text-slate-900 flex items-center gap-3 mb-6">
               <Briefcase className="text-brand-600" /> Baggage Info
            </h3>
            <div className="bg-white border border-slate-100 rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="space-y-1.5 flex-1">
                 <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</p>
                 <p className="text-xs md:text-sm text-slate-700 font-medium whitespace-pre-line">{quote.baggageDetails}</p>
               </div>
               <div className="flex gap-8 md:gap-10 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                 <div className="space-y-0.5 text-center flex-1 md:flex-none">
                   <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</p>
                   <p className="text-base md:text-lg font-bold text-slate-900">{quote.baggagePcs || 0}</p>
                 </div>
                 <div className="space-y-0.5 text-right flex-1 md:flex-none">
                   <p className="text-[8px] md:text-[10px] font-bold text-brand-600 uppercase tracking-widest">Total</p>
                   <p className="text-lg md:text-xl font-black text-brand-600">{quote.currency} {((quote.baggagePcs || 0) * (quote.baggageRate || 0)).toLocaleString()}</p>
                 </div>
               </div>
            </div>
          </div>
        )}

        {quote.extraTitle && (
          <div className="p-6 md:p-12 border-t bg-slate-50/30">
            <h3 className="text-lg md:text-xl font-serif font-bold text-slate-900 flex items-center gap-3 mb-6">
               <Layers className="text-brand-600" /> Add-ons
            </h3>
            <div className="bg-white border border-slate-100 rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="space-y-1.5 flex-1">
                 <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</p>
                 <p className="text-xs md:text-sm text-slate-700 font-black uppercase tracking-widest">{quote.extraTitle}</p>
               </div>
               <div className="flex gap-8 md:gap-10 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                 <div className="space-y-0.5 text-center flex-1 md:flex-none">
                   <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</p>
                   <p className="text-base md:text-lg font-bold text-slate-900">{quote.extraPax || 0}</p>
                 </div>
                 <div className="space-y-0.5 text-right flex-1 md:flex-none">
                   <p className="text-[8px] md:text-[10px] font-bold text-brand-600 uppercase tracking-widest">Total</p>
                   <p className="text-lg md:text-xl font-black text-brand-600">{quote.currency} {((quote.extraPax || 0) * (quote.extraRate || 0)).toLocaleString()}</p>
                 </div>
               </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t">
           <div className="p-6 md:p-12 bg-slate-50 space-y-4 md:space-y-6">
              <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs md:text-sm">
                 <CheckSquare size={16} className="text-green-600" /> Inclusions
              </h3>
              <ul className="space-y-2 md:space-y-3">
                 {smartInclusions.map((inc, i) => (
                   <li key={i} className="flex items-start gap-3 text-xs md:text-sm text-slate-700">
                      <span className="text-green-500 mt-0.5 md:mt-1 shrink-0">✓</span> {inc}
                   </li>
                 ))}
              </ul>
           </div>
           <div className="p-6 md:p-12 space-y-4 md:space-y-6 border-t md:border-t-0 md:border-l">
              <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs md:text-sm">
                 <X size={16} className="text-red-500" /> Exclusions
              </h3>
              <ul className="space-y-2 md:space-y-3">
                 {smartExclusions.map((exc, i) => (
                   <li key={i} className="flex items-start gap-3 text-xs md:text-sm text-slate-500">
                      <span className="text-red-400 mt-0.5 md:mt-1 shrink-0">✕</span> {exc}
                   </li>
                 ))}
              </ul>
           </div>
        </div>

        {quote.cancellationPolicy && (
          <div className="p-6 md:p-12 border-t bg-slate-50/50">
             <h3 className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={14} className="text-brand-600" /> Cancellation Terms
             </h3>
             <div className="text-[10px] md:text-xs text-slate-500 leading-relaxed whitespace-pre-line bg-white p-4 md:p-6 rounded-lg border border-slate-100 shadow-sm">
                {quote.cancellationPolicy}
             </div>
          </div>
        )}

        <div className="p-6 md:p-12 bg-slate-50 border-t border-slate-100 text-center space-y-6">
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12">
              <div className="space-y-0.5">
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1 justify-center">
                   <Clock size={10} /> Validity
                </p>
                <p className="text-[10px] md:text-xs font-black text-red-600 uppercase tracking-widest">Strictly 24 Hours</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Issue Date</p>
                <p className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-widest">{formattedProposalDate}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Hotline</p>
                <p className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-widest">01-4547009</p>
              </div>
           </div>

           <div className="pt-6 border-t border-slate-200 text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>Proposal: {quote.id.slice(0,8).toUpperCase()}</span>
              <span>&copy; 2025 Simrik Adventures Holidays</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreview;
