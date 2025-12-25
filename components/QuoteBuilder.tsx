import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Quote, ItineraryItem, ItemType, Library, MasterItem, ItineraryTemplate } from '../types';
import { 
  ArrowLeft, Plus, Trash2, Plane, Hotel, 
  TentTree, Car, Sparkles, Save, Eye,
  X, CheckSquare, BookmarkPlus, ChevronDown, ChevronRight, ChevronLeft, Settings2, Edit3, Check, Search, Download, Info, Upload, RefreshCw, Link, Package, Copy, Settings, Calendar, AlertCircle, ChevronUp, FileText, MapPin, ArrowUp, ArrowDown, CloudSync, Briefcase, DollarSign, UserCheck, Layers
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface QuoteBuilderProps {
  initialQuote?: Quote | null;
  library: Library;
  remoteUrl: string;
  remoteTemplatesUrl: string;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
  onPreview: (quote: Quote) => void;
  onAddToLibrary: (category: keyof Library, item: string | MasterItem | any) => void;
  onUpdateLibrary: (category: keyof Library, index: number, newValue: string | MasterItem) => void;
  onRemoveFromLibrary: (category: keyof Library, index: number) => void;
  onSetLibrary: (lib: Library) => void;
  onSetRemoteUrl: (url: string) => void;
  onSetRemoteTemplatesUrl: (url: string) => void;
  onSyncRemote: (url?: string) => Promise<void>;
  onSyncTemplates: (url?: string) => Promise<void>;
}

const emptyQuote: Quote = {
  id: '', title: '', destination: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
  client: { name: '', email: '', travelers: { adults: 2, children: 0, infants: 0 } },
  items: [], status: 'draft', createdAt: new Date().toISOString(),
  pricePerAdult: 0, pricePerChild: 0, pricePerInfant: 0, currency: 'NPR',
  inclusions: [], exclusions: [], cancellationPolicy: '', flightDetails: '', hotelDetails: '',
  baggageDetails: '', baggageRate: 0, baggagePcs: 0, generatedBy: '',
  extraTitle: '', extraRate: 0, extraPax: 0
};

const SmartTagInput: React.FC<{
  placeholder: string;
  onAdd: (text: string) => void;
  suggestions: string[];
  existingTags: string[];
  className?: string;
}> = ({ placeholder, onAdd, suggestions, existingTags, className }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    const query = input.toLowerCase().trim();
    if (!query) return [];
    return suggestions.filter(s => 
      s.toLowerCase().includes(query) && 
      !existingTags.some(et => et.toLowerCase() === s.toLowerCase())
    );
  }, [input, suggestions, existingTags]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (val: string) => {
    const cleanVal = val.trim();
    if (cleanVal && !existingTags.some(t => t.toLowerCase() === cleanVal.toLowerCase())) {
      onAdd(cleanVal);
    }
    setInput('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 transition-all shadow-sm ${className}`}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd(input);
            }
          }}
        />
        <button 
          type="button"
          onClick={() => handleAdd(input)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-3 rounded-lg text-xs font-bold transition-colors"
        >
          Add
        </button>
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] max-h-48 overflow-y-auto">
          {filteredSuggestions.map((s, idx) => (
            <button 
              key={idx} 
              type="button"
              onClick={() => handleAdd(s)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 border-b last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ 
  initialQuote, library, remoteUrl, remoteTemplatesUrl, onSave, onCancel, onPreview, onAddToLibrary, onUpdateLibrary, onRemoveFromLibrary, onSetLibrary, onSetRemoteUrl, onSetRemoteTemplatesUrl, onSyncRemote, onSyncTemplates
}) => {
  const [quote, setQuote] = useState<Quote>(() => {
    return initialQuote ? JSON.parse(JSON.stringify(initialQuote)) : { ...emptyQuote, id: uuidv4() };
  });

  const [activeTab, setActiveTab] = useState<'details' | 'itinerary' | 'extras' | 'library'>('details');
  const [libSubTab, setLibSubTab] = useState<keyof Library | 'terms' | 'sync'>('activities');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingMaster, setEditingMaster] = useState<{cat: keyof Library, index: number, item: MasterItem} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newPolicyInput, setNewPolicyInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuote) setQuote(JSON.parse(JSON.stringify(initialQuote)));
  }, [initialQuote]);

  const groupedItems = useMemo(() => {
    const groups: Record<number, ItineraryItem[]> = {};
    const start = new Date(quote.startDate);
    const end = new Date(quote.endDate);
    let diffDays = 1;
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      diffDays = Math.max(Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);
    }
    const maxDayInItems = quote.items.length > 0 ? Math.max(...quote.items.map(i => i.day)) : 0;
    const finalDays = Math.max(diffDays, maxDayInItems);
    
    for (let i = 1; i <= finalDays; i++) groups[i] = [];
    quote.items.forEach(item => {
      if (!groups[item.day]) groups[item.day] = [];
      groups[item.day].push(item);
    });
    return groups;
  }, [quote.items, quote.startDate, quote.endDate]);

  const calculatedTotal = useMemo(() => {
    const travelersTotal = (quote.pricePerAdult * (quote.client.travelers.adults || 0)) + 
                           (quote.pricePerChild * (quote.client.travelers.children || 0)) + 
                           (quote.pricePerInfant * (quote.client.travelers.infants || 0));
    const baggageTotal = (quote.baggageRate || 0) * (quote.baggagePcs || 0);
    const extraTotal = (quote.extraRate || 0) * (quote.extraPax || 0);
    return travelersTotal + baggageTotal + extraTotal;
  }, [quote.pricePerAdult, quote.pricePerChild, quote.pricePerInfant, quote.client.travelers, quote.baggageRate, quote.baggagePcs, quote.extraRate, quote.extraPax]);

  const updateItem = (id: string, updates: Partial<ItineraryItem>) => {
    setQuote(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const addItem = (type: ItemType, day: number) => {
    const newItem: ItineraryItem = {
      id: uuidv4(), type, title: `New ${type}`, description: '', day, city: '', time: '', inclusions: [], exclusions: []
    };
    setQuote(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setExpandedItemId(newItem.id);
  };

  const moveDay = (dayNum: number, direction: 'up' | 'down') => {
    const targetDay = direction === 'up' ? dayNum - 1 : dayNum + 1;
    if (targetDay < 1) return;
    
    setQuote(prev => {
      const newItems = prev.items.map(item => {
        if (item.day === dayNum) return { ...item, day: targetDay };
        if (item.day === targetDay) return { ...item, day: dayNum };
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const toggleTabInclusion = (text: string) => {
    setQuote(prev => {
      const exists = prev.inclusions.includes(text);
      return { ...prev, inclusions: exists ? prev.inclusions.filter(i => i !== text) : [...prev.inclusions, text] };
    });
  };

  const toggleTabExclusion = (text: string) => {
    setQuote(prev => {
      const exists = prev.exclusions.includes(text);
      return { ...prev, exclusions: exists ? prev.exclusions.filter(e => e !== text) : [...prev.exclusions, text] };
    });
  };

  const openSaveTripModal = () => {
    if (quote.items.length === 0) return alert("Itinerary is empty.");
    setNewTemplateName(quote.title || `${quote.destination} Journey`);
    setSaveModalOpen(true);
  };

  const handleSaveTripToLibrary = () => {
    if (!newTemplateName.trim()) return alert("Please provide a name.");
    const template: ItineraryTemplate = {
      name: newTemplateName.trim(),
      destination: quote.destination || 'Global',
      items: quote.items.map(({ id, ...rest }) => ({
        ...rest,
        inclusions: [...(rest.inclusions || [])],
        exclusions: [...(rest.exclusions || [])]
      }))
    };
    onAddToLibrary('itineraryTemplates', template);
    setSaveModalOpen(false);
    alert('Trip saved to local vault.');
  };

  const handleInjectTemplate = (template: ItineraryTemplate) => {
    const newItems: ItineraryItem[] = template.items.map(item => ({ 
      ...item, 
      id: uuidv4(),
      inclusions: [...(item.inclusions || [])],
      exclusions: [...(item.exclusions || [])]
    }));
    setQuote(prev => ({
      ...prev,
      items: [...prev.items, ...newItems],
      destination: prev.destination || template.destination
    }));
    setActiveTab('itinerary');
  };

  const handleSyncVault = async () => {
    setIsSyncingTemplates(true);
    await onSyncTemplates();
    setIsSyncingTemplates(false);
  };

  const handleSyncMaster = async () => {
    setIsSyncing(true);
    await onSyncRemote();
    setIsSyncing(false);
  };

  const handleExportTemplates = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library.itineraryTemplates || [], null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "itinerary_templates.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportTemplates = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onSetLibrary({ ...library, itineraryTemplates: [...(library.itineraryTemplates || []), ...json] });
          alert("Templates imported successfully!");
        } else {
          alert("Invalid template format. Expected an array of templates.");
        }
      } catch (err) { alert("Failed to parse JSON file."); }
    };
    reader.readAsText(file);
  };

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.toLowerCase();
    const templates = library.itineraryTemplates || [];
    return templates.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.destination.toLowerCase().includes(query)
    );
  }, [library.itineraryTemplates, templateSearch]);

  const handleAddPolicy = () => {
    if (!newPolicyInput.trim()) return;
    onAddToLibrary('cancellationPolicies', newPolicyInput.trim());
    setNewPolicyInput('');
  };

  const togglePolicy = (policy: string) => {
    setQuote(prev => {
      const currentPolicies = prev.cancellationPolicy ? prev.cancellationPolicy.split('\n').map(p => p.trim()).filter(Boolean) : [];
      const exists = currentPolicies.includes(policy.trim());
      const newPolicies = exists 
        ? currentPolicies.filter(p => p !== policy.trim()) 
        : [...currentPolicies, policy.trim()];
      return { ...prev, cancellationPolicy: newPolicies.join('\n') };
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            onSetLibrary(json);
            alert("Library imported!");
          } catch (err) { alert("Failed to parse JSON file."); }
        };
        reader.readAsText(file);
      }} />

      <input type="file" ref={templateImportRef} className="hidden" accept=".json" onChange={handleImportTemplates} />

      {/* LEFT SIDEBAR (Vault) with Toggle */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-16'} bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-20 shadow-lg transition-all duration-300 relative overflow-hidden group/sidebar`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 z-50 w-6 h-12 bg-white border border-slate-200 shadow-xl rounded-r-lg flex items-center justify-center text-slate-400 hover:text-brand-600 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </button>

        {/* Action Strip (Icons shown when collapsed) */}
        {!isSidebarOpen && (
          <div className="flex flex-col items-center py-6 gap-6 w-full">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><Package size={20}/></div>
            <button onClick={openSaveTripModal} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Save Current Trip"><BookmarkPlus size={20}/></button>
            <button onClick={handleSyncVault} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Sync Vault"><CloudSync size={20}/></button>
            <button onClick={() => setActiveTab('library')} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Master Library"><Settings2 size={20}/></button>
            <div className="h-px w-8 bg-slate-100"></div>
            <div className="flex-1 flex flex-col items-center gap-4 overflow-y-auto no-scrollbar py-2">
               {filteredTemplates.slice(0, 10).map((t, idx) => (
                 <button key={idx} onClick={() => handleInjectTemplate(t)} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-brand-50 text-[10px] font-black text-slate-400 hover:text-brand-600 flex items-center justify-center border border-slate-100 transition-all uppercase" title={t.name}>
                   {t.name.charAt(0)}
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* Full Content */}
        <div className={`${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} flex flex-col h-full w-80 overflow-hidden transition-all duration-300`}>
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <Package size={20}/>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Library Vault</h3>
            </div>
            <button 
              onClick={openSaveTripModal}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <BookmarkPlus size={16}/> Save Current Trip
            </button>
          </div>

          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500" size={14} />
              <input 
                type="text" 
                placeholder="Search vault..." 
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center px-4">
                <Package size={32} className="mb-4 opacity-10"/>
                <p className="text-[10px] font-bold uppercase tracking-widest">Vault is empty</p>
              </div>
            ) : (
              filteredTemplates.map((temp, i) => (
                <div key={i} className="group bg-white border border-slate-100 p-4 rounded-2xl hover:border-brand-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1">{temp.name}</h4>
                    <button 
                      onClick={() => onRemoveFromLibrary('itineraryTemplates', library.itineraryTemplates.indexOf(temp))}
                      className="p-1 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12}/>
                    </button>
                  </div>
                  <div className="text-[9px] text-brand-600 uppercase tracking-widest font-bold mb-4">{temp.destination}</div>
                  <button 
                    onClick={() => handleInjectTemplate(temp)}
                    className="w-full py-2 bg-brand-50 hover:bg-brand-600 text-brand-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Copy size={12}/> Use Trip
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <button 
              onClick={handleSyncVault}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 bg-white hover:bg-brand-50 border border-slate-200 rounded-lg text-slate-500 hover:text-brand-600 transition-all text-[9px] font-black uppercase tracking-widest group"
              title="Sync with Saved Trips Cloud"
            >
              <RefreshCw size={14} className={isSyncingTemplates ? "animate-spin" : ""} /> Sync
            </button>
            <button 
              onClick={handleExportTemplates}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 bg-white hover:bg-brand-50 border border-slate-200 rounded-lg text-slate-500 hover:text-brand-600 transition-all text-[9px] font-black uppercase tracking-widest"
              title="Export Templates to JSON"
            >
              <Download size={14} /> Export
            </button>
            <button 
              onClick={() => templateImportRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 bg-white hover:bg-brand-50 border border-slate-200 rounded-lg text-slate-500 hover:text-brand-600 transition-all text-[9px] font-black uppercase tracking-widest"
              title="Import Templates from JSON"
            >
              <Upload size={14} /> Import
            </button>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Global Database</p>
             <button 
               onClick={() => setActiveTab('library')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-brand-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-brand-50 border border-slate-200'}`}
             >
               <Settings2 size={16}/> 
               <span>Master Library</span>
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all"><ArrowLeft size={20}/></button>
            <div className="space-y-0.5 hidden xl:block">
              <h2 className="text-sm font-black text-slate-900">{quote.title || 'Draft Quotation'}</h2>
              <p className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">Proposal Builder</p>
            </div>
            
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl ml-4 border border-slate-200 overflow-x-auto no-scrollbar max-w-[500px]">
              {[
                { id: 'details', label: 'Details', icon: <Info size={14}/> },
                { id: 'itinerary', label: 'Itinerary', icon: <Calendar size={14}/> },
                { id: 'extras', label: 'Extras', icon: <Plus size={14}/> },
                { id: 'library', label: 'Master Library', icon: <Settings2 size={14}/> }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onPreview(quote)} className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all"><Eye size={16}/> Preview</button>
            <button onClick={() => onSave(quote)} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2"><Save size={16}/> Save Quote</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto pb-10">
            
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <h3 className="font-serif font-black text-2xl text-slate-900 flex items-center gap-2"><UserCheck className="text-brand-600" /> Guest Profiles</h3>
                  <div className="space-y-4">
                    <input type="text" value={quote.client.name} onChange={(e) => setQuote(p=>({...p, client:{...p.client, name:e.target.value}}))} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 transition-all bg-slate-50/50" placeholder="Full Name" />
                    <input type="email" value={quote.client.email} onChange={(e) => setQuote(p=>({...p, client:{...p.client, email:e.target.value}}))} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 transition-all bg-slate-50/50" placeholder="Email Address" />
                    <div className="grid grid-cols-3 gap-4">
                      {['adults', 'children', 'infants'].map(k => (
                        <div key={k}>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">{k}</label>
                          <input type="number" min="0" value={(quote.client.travelers as any)[k]} onChange={(e) => setQuote(p=>({...p, client:{...p.client, travelers:{...p.client.travelers, [k]:parseInt(e.target.value)||0}}}))} className="w-full px-4 py-2 rounded-xl border border-slate-200 font-black bg-slate-50/50 text-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <h3 className="font-serif font-black text-2xl text-slate-900 flex items-center gap-2"><DollarSign className="text-brand-600" /> Financial Breakdown</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Adult Rate</label>
                        <input type="number" value={quote.pricePerAdult} onChange={(e) => setQuote(p=>({...p, pricePerAdult: parseFloat(e.target.value)||0}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Child Rate</label>
                        <input type="number" value={quote.pricePerChild} onChange={(e) => setQuote(p=>({...p, pricePerChild: parseFloat(e.target.value)||0}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Infant Rate</label>
                        <input type="number" value={quote.pricePerInfant} onChange={(e) => setQuote(p=>({...p, pricePerInfant: parseFloat(e.target.value)||0}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Currency Code</label>
                      <input type="text" value={quote.currency} onChange={(e) => setQuote(p=>({...p, currency: e.target.value.toUpperCase()}))} className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <h3 className="font-serif font-black text-2xl text-slate-900 flex items-center gap-2"><Sparkles className="text-brand-600" /> Trip Scope</h3>
                  <div className="space-y-4">
                    <input type="text" value={quote.title} onChange={(e) => setQuote(p=>({...p, title:e.target.value}))} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 transition-all bg-slate-50/50 font-bold" placeholder="Proposal Title" />
                    <input type="text" value={quote.destination} onChange={(e) => setQuote(p=>({...p, destination:e.target.value}))} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 transition-all bg-slate-50/50 font-bold" placeholder="Destination" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={quote.startDate} onChange={(e) => setQuote(p=>({...p, startDate:e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 font-bold" />
                      <input type="date" value={quote.endDate} onChange={(e) => setQuote(p=>({...p, endDate:e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 font-bold" />
                    </div>
                    <div className="relative">
                      <input type="text" value={quote.generatedBy} onChange={(e) => setQuote(p=>({...p, generatedBy:e.target.value}))} className="w-full px-5 py-3 pl-11 rounded-xl border border-slate-200 outline-none focus:border-brand-500 transition-all bg-slate-50/50 font-medium" placeholder="Generated By (Your Name)" />
                      <Edit3 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <h3 className="font-serif font-black text-2xl text-slate-900 flex items-center gap-2"><Briefcase className="text-brand-600" /> Baggage Section</h3>
                  <div className="space-y-4">
                    <textarea value={quote.baggageDetails} onChange={(e) => setQuote(p=>({...p, baggageDetails: e.target.value}))} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 transition-all bg-slate-50/50 text-sm h-20 resize-none" placeholder="Baggage Details (e.g. 20kg check-in + 7kg cabin)" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Baggage Rate</label>
                        <input type="number" value={quote.baggageRate} onChange={(e) => setQuote(p=>({...p, baggageRate: parseFloat(e.target.value)||0}))} className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Qty</label>
                        <input type="number" value={quote.baggagePcs} onChange={(e) => setQuote(p=>({...p, baggagePcs: parseInt(e.target.value)||0}))} className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra Section */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <h3 className="font-serif font-black text-2xl text-slate-900 flex items-center gap-2"><Layers className="text-brand-600" /> Extra Services</h3>
                  <div className="space-y-4">
                    <input type="text" value={quote.extraTitle} onChange={(e) => setQuote(p=>({...p, extraTitle: e.target.value}))} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 transition-all bg-slate-50/50 font-bold" placeholder="Extra Service Title (e.g. Visa Fee, Gala Dinner)" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Unit Rate</label>
                        <input type="number" value={quote.extraRate} onChange={(e) => setQuote(p=>({...p, extraRate: parseFloat(e.target.value)||0}))} className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Qty</label>
                        <input type="number" value={quote.extraPax} onChange={(e) => setQuote(p=>({...p, extraPax: parseInt(e.target.value)||0}))} className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50/50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-center bg-brand-600 p-8 rounded-3xl shadow-xl relative overflow-hidden">
                   <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-4 -translate-y-4 pointer-events-none text-white"><Sparkles size={160}/></div>
                  <div className="relative z-10">
                    <h4 className="font-serif font-black text-white text-2xl mb-1">Itinerary Designer</h4>
                    <p className="text-[10px] font-bold text-brand-100 uppercase tracking-widest">Inject multi-day plans from vault or build custom</p>
                  </div>
                  <button onClick={() => addItem('activity', Object.keys(groupedItems).length + 1)} className="relative z-10 flex items-center gap-3 bg-white text-brand-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                    <Plus size={16}/> New Day {Object.keys(groupedItems).length + 1}
                  </button>
                </div>

                {Object.keys(groupedItems).sort((a,b) => parseInt(a)-parseInt(b)).map((dayStr, index, array) => {
                  const day = parseInt(dayStr);
                  const items = groupedItems[day];
                  return (
                    <div key={day} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8 group hover:shadow-md transition-all">
                      <div className="bg-slate-50/80 px-8 py-5 border-b flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <h3 className="font-black text-slate-900 text-2xl tracking-tight">Day {day}</h3>
                          <div className="flex gap-1">
                            <button 
                              disabled={index === 0} 
                              onClick={() => moveDay(day, 'up')}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                              title="Move Day Up"
                            >
                              <ArrowUp size={14}/>
                            </button>
                            <button 
                              disabled={index === array.length - 1} 
                              onClick={() => moveDay(day, 'down')}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                              title="Move Day Down"
                            >
                              <ArrowDown size={14}/>
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {['flight', 'hotel', 'activity', 'transfer'].map(t => (
                            <button key={t} onClick={() => addItem(t as any, day)} className="p-3 bg-white hover:bg-brand-600 hover:text-white rounded-2xl text-slate-400 shadow-sm border border-slate-50 transition-all transform active:scale-90" title={`Add ${t}`}>
                              {t === 'flight' ? <Plane size={18}/> : t === 'hotel' ? <Hotel size={18}/> : t === 'activity' ? <TentTree size={18}/> : <Car size={18}/>}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-8 space-y-6">
                        {items.length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300">
                             <p className="font-black text-[10px] uppercase tracking-widest">Day {day} is empty</p>
                          </div>
                        ) : items.map(item => {
                          const isExp = expandedItemId === item.id;
                          const category = item.type === 'activity' ? 'activities' : item.type === 'transfer' ? 'transfers' : item.type === 'flight' ? 'flights' : 'hotels';
                          const libItems = (library as any)[category] || [];
                          return (
                            <div key={item.id} className="border border-slate-50 rounded-3xl p-6 hover:border-brand-200 transition-all bg-white shadow-sm relative">
                              <div className="flex flex-col gap-6">
                                <div className="flex gap-6">
                                  <div className="mt-1 p-4 bg-slate-50 rounded-2xl text-brand-600 shadow-inner flex items-center justify-center w-14 h-14 shrink-0">
                                    {item.type === 'flight' ? <Plane size={24}/> : item.type === 'hotel' ? <Hotel size={24}/> : item.type === 'activity' ? <TentTree size={24}/> : <Car size={24}/>}
                                  </div>
                                  <div className="flex-1 space-y-4 min-w-0">
                                    <div className="flex gap-4 relative items-start">
                                      <input type="text" value={item.time} onChange={(e)=>updateItem(item.id, {time: e.target.value})} className="w-24 text-[10px] font-black border border-slate-100 bg-slate-50 rounded-xl p-2.5 text-center outline-none shadow-inner" placeholder="TIME"/>
                                      <div className="flex-1 flex items-center bg-white border-b-2 border-transparent focus-within:border-brand-500 transition-colors">
                                        <input type="text" value={item.title} onChange={(e)=>updateItem(item.id, {title: e.target.value})} className="flex-1 font-black text-xl text-slate-800 outline-none py-1 truncate bg-transparent" placeholder="Service title..."/>
                                        <button onClick={()=>setOpenDropdownId(openDropdownId === item.id ? null : item.id)} className="p-2 hover:bg-slate-50 rounded-xl ml-2"><ChevronDown size={22} className="text-slate-300"/></button>
                                        {openDropdownId === item.id && (
                                          <div className="absolute right-0 top-full mt-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] max-h-80 overflow-y-auto p-3 space-y-1 animate-in fade-in zoom-in-95">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 p-2 border-b mb-2">Insert Master Item</h5>
                                            {libItems.map((t: MasterItem, idx: number) => (
                                              <button key={idx} onClick={() => {
                                                updateItem(item.id, { 
                                                  title: t.title, 
                                                  description: t.description, 
                                                  city: t.city || '', 
                                                  inclusions: [...(t.inclusions || [])], 
                                                  exclusions: [...(t.exclusions || [])] 
                                                });
                                                setOpenDropdownId(null);
                                              }} className="w-full text-left p-4 hover:bg-brand-50 rounded-xl transition-all group border-b border-slate-50 last:border-0">
                                                <div className="font-black text-slate-900 text-sm group-hover:text-brand-700">{t.title}</div>
                                                <div className="text-[10px] text-slate-500 line-clamp-1">{t.city ? `@ ${t.city}` : t.description}</div>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <textarea value={item.description} onChange={(e)=>updateItem(item.id, {description: e.target.value})} className="w-full text-sm text-slate-600 resize-none outline-none leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-transparent focus:border-slate-200 shadow-inner" rows={2} placeholder="Service description..."/>
                                    
                                    <div className="flex items-center gap-2 group/city">
                                      <MapPin size={14} className="text-slate-300 group-focus-within/city:text-brand-500"/>
                                      <input 
                                        type="text" 
                                        value={item.city || ''} 
                                        onChange={(e)=>updateItem(item.id, {city: e.target.value})} 
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 focus:text-brand-600 outline-none bg-transparent border-b border-transparent focus:border-brand-200 py-0.5"
                                        placeholder="SET CITY (FOR HOTEL MATCHING)"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <button onClick={()=>setExpandedItemId(isExp ? null : item.id)} className={`p-3 rounded-2xl transition-all ${isExp ? 'bg-brand-50 text-brand-600 shadow-inner' : 'text-slate-200 hover:bg-slate-50 hover:text-slate-500'}`}>
                                      {isExp ? <ChevronUp size={22}/> : <ChevronDown size={22}/>}
                                    </button>
                                    <button onClick={()=>setQuote(p=>({...p, items:p.items.filter(i=>i.id!==item.id)}))} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 size={22}/></button>
                                  </div>
                                </div>

                                {isExp && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Item Inclusions</label>
                                      <div className="flex flex-wrap gap-1">
                                        {(item.inclusions || []).map((inc, i) => (
                                          <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-[9px] font-bold rounded-lg border border-green-100 flex items-center gap-1">
                                            {inc} <button onClick={() => updateItem(item.id, { inclusions: item.inclusions?.filter((_,idx)=>idx!==i) })}><X size={10}/></button>
                                          </span>
                                        ))}
                                      </div>
                                      <SmartTagInput 
                                        placeholder="Add inclusion..." 
                                        onAdd={(t) => updateItem(item.id, { inclusions: [...(item.inclusions || []), t] })} 
                                        suggestions={library.inclusions} 
                                        existingTags={item.inclusions || []}
                                        className="py-1 text-xs"
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Item Exclusions</label>
                                      <div className="flex flex-wrap gap-1">
                                        {(item.exclusions || []).map((exc, i) => (
                                          <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-[9px] font-bold rounded-lg border border-red-100 flex items-center gap-1">
                                            {exc} <button onClick={() => updateItem(item.id, { exclusions: item.exclusions?.filter((_,idx)=>idx!==i) })}><X size={10}/></button>
                                          </span>
                                        ))}
                                      </div>
                                      <SmartTagInput 
                                        placeholder="Add exclusion..." 
                                        onAdd={(t) => updateItem(item.id, { exclusions: [...(item.exclusions || []), t] })} 
                                        suggestions={library.exclusions} 
                                        existingTags={item.exclusions || []}
                                        className="py-1 text-xs"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
                  <div className="flex items-center gap-4 border-b pb-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><AlertCircle size={20}/></div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">Trip Cancellation Policy</h3>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select from Master Terms (Multiple Selection)</p>
                    <div className="flex flex-wrap gap-2">
                      {library.cancellationPolicies?.map((policy, idx) => {
                        const isActive = quote.cancellationPolicy.split('\n').map(p => p.trim()).includes(policy.trim());
                        return (
                          <button 
                            key={idx}
                            onClick={() => togglePolicy(policy)}
                            className={`px-5 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all text-left max-w-sm ${isActive ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'}`}
                          >
                            {policy}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Custom Assignment / Resulting Policy</p>
                       <textarea 
                        value={quote.cancellationPolicy}
                        onChange={(e) => setQuote(p => ({ ...p, cancellationPolicy: e.target.value }))}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:border-red-500 text-sm h-32 bg-slate-50/50 resize-none font-medium leading-relaxed"
                        placeholder="Define or refine the cancellation policy for this specific quote..."
                       />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'extras' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
                  <h3 className="font-serif font-black text-2xl text-slate-900">Package Inclusions</h3>
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Toggle from Master List</p>
                    <div className="flex flex-wrap gap-2">
                      {library.inclusions.map((inc, i) => {
                        const active = quote.inclusions.includes(inc);
                        return (
                          <button key={i} onClick={() => toggleTabInclusion(inc)} className={`px-5 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-brand-600 border-brand-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'}`}>
                            {inc}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-6">
                      <SmartTagInput placeholder="Add custom inclusion..." onAdd={(text) => toggleTabInclusion(text)} suggestions={library.inclusions} existingTags={quote.inclusions} />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
                  <h3 className="font-serif font-black text-2xl text-slate-900">Package Exclusions</h3>
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Toggle from Master List</p>
                    <div className="flex flex-wrap gap-2">
                      {library.exclusions.map((exc, i) => {
                        const active = quote.exclusions.includes(exc);
                        return (
                          <button key={i} onClick={() => toggleTabExclusion(exc)} className={`px-5 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'}`}>
                            {exc}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-6">
                      <SmartTagInput placeholder="Add custom exclusion..." onAdd={(text) => toggleTabExclusion(text)} suggestions={library.exclusions} existingTags={quote.exclusions} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 mb-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                    <div className="flex items-center gap-6">
                      <div className="p-5 bg-brand-100 text-brand-700 rounded-3xl shadow-sm"><Settings2 size={36}/></div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Master Library</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Add and manage custom service templates</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", "master_library.json");
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                      }} className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 shadow-sm"><Download size={16}/> Export</button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 shadow-sm"><Upload size={16}/> Import</button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-12 p-2 bg-slate-100 rounded-2xl w-fit border border-slate-200">
                    {[
                      {id: 'activities', label: 'Activities', icon: <TentTree size={16}/>},
                      {id: 'transfers', label: 'Transfers', icon: <Car size={16}/>},
                      {id: 'hotels', label: 'Hotels', icon: <Hotel size={16}/>},
                      {id: 'flights', label: 'Flights', icon: <Plane size={16}/>},
                      {id: 'terms', label: 'Cancellation Policies', icon: <FileText size={16}/>},
                      {id: 'sync', label: 'Cloud Sync', icon: <RefreshCw size={16}/>},
                    ].map(tab => (
                      <button 
                        key={tab.id} 
                        onClick={() => setLibSubTab(tab.id as any)} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${libSubTab === tab.id ? 'bg-white text-brand-600 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {libSubTab === 'sync' ? (
                    <div className="max-w-xl space-y-10 animate-in fade-in">
                       <div className="space-y-4">
                          <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-sm">Master Library Sync URL</h4>
                          <div className="flex gap-4">
                             <input type="text" value={remoteUrl} onChange={(e)=>onSetRemoteUrl(e.target.value)} className="flex-1 px-5 py-4 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-bold shadow-sm" placeholder="Paste Master Gist RAW URL..." />
                             <button onClick={handleSyncMaster} disabled={isSyncing} className={`px-8 py-4 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 transition-all'}`}>
                                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/> Sync Master
                             </button>
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-sm">Saved Trips Vault Sync URL</h4>
                          <div className="flex gap-4">
                             <input type="text" value={remoteTemplatesUrl} onChange={(e)=>onSetRemoteTemplatesUrl(e.target.value)} className="flex-1 px-5 py-4 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-bold shadow-sm" placeholder="Paste Templates Gist RAW URL..." />
                             <button onClick={handleSyncVault} disabled={isSyncingTemplates} className={`px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 ${isSyncingTemplates ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 transition-all'}`}>
                                <RefreshCw size={18} className={isSyncingTemplates ? 'animate-spin' : ''}/> Sync Vault
                             </button>
                          </div>
                       </div>
                    </div>
                  ) : libSubTab === 'terms' ? (
                    <div className="max-w-4xl animate-in fade-in space-y-8">
                      <div className="flex justify-between items-center border-b pb-4">
                         <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Master Cancellation Policies</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         {library.cancellationPolicies?.map((policy, i) => (
                           <div key={i} className="flex gap-4 group bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                              <div className="flex-1 font-medium text-slate-700 text-sm whitespace-pre-line leading-relaxed">
                                {policy}
                              </div>
                              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                 <button onClick={()=>onRemoveFromLibrary('cancellationPolicies', i)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                              </div>
                           </div>
                         ))}
                         
                         <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-8 space-y-4 mt-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create New Master Policy</h5>
                            <textarea 
                              value={newPolicyInput} 
                              onChange={(e) => setNewPolicyInput(e.target.value)} 
                              className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:border-brand-600 bg-slate-50/50 text-sm h-32 resize-none"
                              placeholder="Describe the cancellation terms clearly..."
                            />
                            <button 
                              onClick={handleAddPolicy}
                              className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ml-auto"
                            >
                              <Plus size={16}/> Add to Repository
                            </button>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                       {((library as any)[libSubTab] || []).map((item: MasterItem, i: number) => (
                         <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-brand-200 group transition-all relative flex flex-col justify-between shadow-sm">
                            <div>
                               <div className="flex justify-between items-start mb-4">
                                  <div className="space-y-1">
                                    <h5 className="font-black text-slate-900 text-sm line-clamp-1">{item.title}</h5>
                                    {item.city && <p className="text-[8px] font-black text-brand-600 uppercase tracking-widest">@{item.city}</p>}
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                     <button onClick={() => setEditingMaster({cat: libSubTab as any, index: i, item: JSON.parse(JSON.stringify(item))})} className="p-2 bg-white text-brand-600 rounded-lg shadow-sm hover:bg-brand-50"><Edit3 size={14}/></button>
                                     <button onClick={() => onRemoveFromLibrary(libSubTab as any, i)} className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"><Trash2 size={14}/></button>
                                  </div>
                               </div>
                               <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 italic">"{item.description || 'No description provided.'}"</p>
                            </div>
                            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{libSubTab.slice(0, -1)}</span>
                               <span className="text-[10px] font-bold text-brand-500">{(item.inclusions?.length || 0)} Inc.</span>
                            </div>
                         </div>
                       ))}
                       <button onClick={() => onAddToLibrary(libSubTab as any, { title: `New ${libSubTab.slice(0, -1)} Template`, description: '', city: '', inclusions: [], exclusions: [] })} className="p-8 border-4 border-dashed border-slate-100 rounded-3xl text-slate-300 hover:border-brand-200 hover:text-brand-600 transition-all flex flex-col items-center justify-center gap-2 group bg-white shadow-sm">
                          <Plus size={32} className="group-hover:scale-110 transition-transform"/>
                          <p className="font-black text-[10px] uppercase tracking-widest">Add Master {libSubTab.slice(0, -1)}</p>
                       </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 py-4 px-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] shrink-0">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-10">
              <div className="shrink-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quote Estimate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-500 font-black uppercase tracking-widest">{quote.currency}</span>
                  <span className="text-4xl font-black tabular-nums tracking-tighter text-slate-900">{(calculatedTotal || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                <p className="text-sm font-bold text-slate-700">{quote.destination || 'Global'}</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
               <button onClick={() => onPreview(quote)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all hover:bg-slate-100">Review Draft</button>
               <button onClick={() => onSave(quote)} className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-xl">Finalize & Save</button>
            </div>
          </div>
        </div>
      </div>

      {saveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="font-black text-xl text-slate-900">Save Trip to Vault</h3>
                <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">Create reusable itinerary template</p>
              </div>
              <button onClick={() => setSaveModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-900"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Template Name</label>
                <input 
                  type="text" 
                  value={newTemplateName} 
                  onChange={(e)=>setNewTemplateName(e.target.value)} 
                  autoFocus
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-bold bg-slate-50/50" 
                  placeholder="e.g. Luxury Everest Trek"
                />
              </div>
              <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-start gap-3">
                 <Info className="text-brand-600 shrink-0 mt-0.5" size={16}/>
                 <p className="text-[10px] text-brand-800 font-medium leading-relaxed">
                   Saving this trip will store all <strong>{quote.items.length} services</strong> (including their specific inclusions and exclusions) as a reusable template in your local vault.
                 </p>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setSaveModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-400 font-bold hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={handleSaveTripToLibrary} className="px-8 py-3 bg-brand-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">Save to Local Vault</button>
            </div>
          </div>
        </div>
      )}

      {editingMaster && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="font-black text-xl text-slate-900">Customize Master Record</h3>
                <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">Editing {editingMaster.cat} repository</p>
              </div>
              <button onClick={() => setEditingMaster(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-900"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Template Title</label>
                  <input type="text" value={editingMaster.item.title} onChange={(e)=>setEditingMaster({...editingMaster, item: {...editingMaster.item, title: e.target.value}})} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-bold bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">City / Location</label>
                  <input type="text" value={editingMaster.item.city || ''} onChange={(e)=>setEditingMaster({...editingMaster, item: {...editingMaster.item, city: e.target.value}})} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-bold bg-slate-50/50" placeholder="e.g. Paris" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Public Description</label>
                <textarea value={editingMaster.item.description} onChange={(e)=>setEditingMaster({...editingMaster, item: {...editingMaster.item, description: e.target.value}})} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 text-sm h-32 bg-slate-50/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Standard Inclusions</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {editingMaster.item.inclusions?.map((inc, i) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-[9px] font-bold rounded-lg border border-green-100 flex items-center gap-1">
                        {inc} <button onClick={()=>setEditingMaster({...editingMaster, item: {...editingMaster.item, inclusions: editingMaster.item.inclusions?.filter((_,idx)=>idx!==i)}})}><X size={10}/></button>
                      </span>
                    ))}
                  </div>
                  <SmartTagInput placeholder="Add..." onAdd={(t)=>setEditingMaster({...editingMaster, item: {...editingMaster.item, inclusions: [...(editingMaster.item.inclusions||[]), t]}})} suggestions={library.inclusions} existingTags={editingMaster.item.inclusions||[]} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Standard Exclusions</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {editingMaster.item.exclusions?.map((exc, i) => (
                      <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-[9px] font-bold rounded-lg border border-red-100 flex items-center gap-1">
                        {exc} <button onClick={()=>setEditingMaster({...editingMaster, item: {...editingMaster.item, exclusions: editingMaster.item.exclusions?.filter((_,idx)=>idx!==i)}})}><X size={10}/></button>
                      </span>
                    ))}
                  </div>
                  <SmartTagInput placeholder="Add..." onAdd={(t)=>setEditingMaster({...editingMaster, item: {...editingMaster.item, exclusions: [...(editingMaster.item.exclusions||[]), t]}})} suggestions={library.exclusions} existingTags={editingMaster.item.exclusions||[]} />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setEditingMaster(null)} className="px-6 py-3 rounded-xl text-slate-400 font-bold hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest">Discard Changes</button>
              <button onClick={() => { onUpdateLibrary(editingMaster.cat, editingMaster.index, editingMaster.item); setEditingMaster(null); }} className="px-8 py-3 bg-brand-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">Update Repository</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteBuilder;