import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteStatus } from '../types.ts';
import { Plus, Search, MapPin, Calendar, ChevronRight, Trash2, CheckCircle2, Send, FileEdit, MoreHorizontal } from 'lucide-react';

interface DashboardProps {
  quotes: Quote[];
  onCreateNew: () => void;
  onSelectQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ quotes, onCreateNew, onSelectQuote, onDeleteQuote, onUpdateStatus }) => {
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenStatusId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusInfo = (status: QuoteStatus) => {
    switch (status) {
      case 'booked': return { color: 'bg-green-100 text-green-700', label: 'Booked', icon: <CheckCircle2 size={12}/> };
      case 'sent': return { color: 'bg-brand-100 text-brand-700', label: 'Sent', icon: <Send size={12}/> };
      case 'cancelled': return { color: 'bg-red-100 text-red-700', label: 'Cancelled', icon: <Trash2 size={12}/> };
      default: return { color: 'bg-slate-100 text-slate-700', label: 'Draft', icon: <FileEdit size={12}/> };
    }
  };

  const calculateTotal = (quote: Quote) => {
    const travelersTotal = (quote.pricePerAdult * (quote.client.travelers.adults || 0)) + 
                           (quote.pricePerChild * (quote.client.travelers.children || 0)) + 
                           (quote.pricePerInfant * (quote.client.travelers.infants || 0));
    const baggageTotal = (quote.baggageRate || 0) * (quote.baggagePcs || 0);
    const extraTotal = (quote.extraRate || 0) * (quote.extraPax || 0);
    return travelersTotal + baggageTotal + extraTotal;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your travel quotes and itineraries.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          Create New Quote
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Draft Proposals</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
            {quotes.filter(q => q.status === 'draft').length}
          </p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Sent to Clients</p>
          <p className="text-2xl md:text-3xl font-bold text-brand-600 mt-2">
            {quotes.filter(q => q.status === 'sent').length}
          </p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 sm:col-span-2 md:col-span-1">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Confirmed Bookings</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">
            {quotes.filter(q => q.status === 'booked').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800 self-start">Active Quotations</h2>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by client or destination..." 
              className="w-full sm:w-80 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {quotes.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <FileEdit size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-medium">No quotes found. Start by creating a new proposal.</p>
            </div>
          ) : (
            quotes.map((quote) => {
              const status = getStatusInfo(quote.status);
              return (
                <div 
                  key={quote.id} 
                  className="p-4 md:p-6 hover:bg-slate-50 transition-colors group flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 md:gap-6 flex-1 w-full" onClick={() => onSelectQuote(quote)}>
                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg shrink-0 ${status.color}`}>
                      {quote.client.name.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                          {quote.title || `Trip to ${quote.destination}`}
                        </h3>
                        <span className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-medium"><MapPin size={12} className="text-brand-500"/> {quote.destination}</span>
                        <span className="flex items-center gap-1 font-medium"><Calendar size={12} className="text-brand-500"/> {quote.startDate}</span>
                        <span className="sm:hidden flex items-center gap-1 font-bold text-brand-600 uppercase tracking-widest">{status.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end border-t border-slate-100 md:border-none pt-3 md:pt-0">
                    <div className="text-left md:text-right" onClick={() => onSelectQuote(quote)}>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Price</p>
                      <p className="font-black text-slate-900 flex items-center md:justify-end gap-1">
                        <span className="text-[10px] text-slate-400 font-normal mr-1">{quote.currency}</span>
                        {calculateTotal(quote).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="relative" ref={openStatusId === quote.id ? dropdownRef : null}>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setOpenStatusId(openStatusId === quote.id ? null : quote.id); }}
                            className={`p-2 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 text-slate-400 hover:text-brand-600 transition-all shadow-sm ${openStatusId === quote.id ? 'ring-2 ring-brand-500 border-brand-500 text-brand-600' : ''}`}
                         >
                            <MoreHorizontal size={18}/>
                         </button>
                         {openStatusId === quote.id && (
                           <div className="absolute right-0 bottom-full mb-2 flex flex-col bg-white border border-slate-200 shadow-2xl rounded-xl p-1.5 z-[100] min-w-[140px] animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest p-2 border-b mb-1">Set Stage</p>
                              {(['draft', 'sent', 'booked', 'cancelled'] as QuoteStatus[]).map(s => (
                                <button 
                                  key={s}
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onUpdateStatus(quote.id, s); 
                                    setOpenStatusId(null); 
                                  }}
                                  className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-colors ${quote.status === s ? 'text-brand-600 bg-brand-50' : 'text-slate-500'}`}
                                >
                                  {s}
                                </button>
                              ))}
                           </div>
                         )}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteQuote(quote.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Quote"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;