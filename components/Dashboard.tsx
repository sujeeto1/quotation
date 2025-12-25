import React from 'react';
import { Quote } from '../types';
import { Plus, Search, MapPin, Calendar, ChevronRight } from 'lucide-react';

interface DashboardProps {
  quotes: Quote[];
  onCreateNew: () => void;
  onSelectQuote: (quote: Quote) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ quotes, onCreateNew, onSelectQuote }) => {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'booked': return 'bg-purple-100 text-purple-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your travel quotes and itineraries.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          Create New Quote
        </button>
      </div>

      {/* Stats Cards (Mock data for visual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Active Quotes</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{quotes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Pending Approval</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {quotes.filter(q => q.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Booked This Month</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {quotes.filter(q => q.status === 'booked').length}
          </p>
        </div>
      </div>

      {/* Quote List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Recent Quotes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search quotes..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {quotes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p>No quotes found. Create your first one!</p>
            </div>
          ) : (
            quotes.map((quote) => (
              <div 
                key={quote.id} 
                onClick={() => onSelectQuote(quote)}
                className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg">
                    {quote.client.name.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {quote.title || `Trip to ${quote.destination}`}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {quote.destination}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {quote.startDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total Value</p>
                    <p className="font-bold text-slate-900 flex items-center justify-end gap-1">
                      <span className="text-xs text-slate-500 font-normal mr-1">{quote.currency}</span>
                      {calculateTotal(quote).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                  <ChevronRight className="text-slate-300 group-hover:text-slate-500" size={20} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;