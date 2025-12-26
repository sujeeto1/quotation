import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard.tsx';
import QuoteBuilder from './components/QuoteBuilder.tsx';
import QuotePreview from './components/QuotePreview.tsx';
import { Quote, Library, MasterItem, QuoteStatus } from './types.ts';

type View = 'dashboard' | 'builder' | 'preview';

const DEFAULT_GIST_URL = 'https://gist.githubusercontent.com/sujeeto1/fa0bc084410880740412aa58a8ae26df/raw/master_library_quotation.json';
const DEFAULT_TEMPLATES_GIST_URL = 'https://gist.githubusercontent.com/sujeeto1/6cb9e32711372fa7affccfb8c71b2f70/raw/quotation_saved_trips.json';

const DEFAULT_LIBRARY: Library = {
  inclusions: ["Welcome Drink", "Visa Assistance", "All Taxes & GST", "Professional Guide", "Private Transfers", "Daily Breakfast"],
  exclusions: ["Personal Expenses", "Travel Insurance", "Tips", "Entry Tickets", "Lunches & Dinners"],
  cancellationPolicies: ["Non-refundable.", "30-day free cancellation."],
  flightTemplates: [],
  hotelTemplates: [],
  flights: [{ title: 'Standard KTM-PKR', description: 'Domestic scenic flight.', inclusions: ['20kg Luggage', '7kg Handcarry'], exclusions: ['In-flight Meals'] }],
  activities: [{ title: 'Full Day Sightseeing', description: 'Visit historic UNESCO sites.', inclusions: ['Private Car', 'Entry Fees'], exclusions: ['Lunch'] }],
  transfers: [{ title: 'Airport Pick-up', description: 'Private sedan with name board.', inclusions: ['Signage', 'Waiting Time'], exclusions: ['Extra stopovers'] }],
  hotels: [{ title: '4-Star Premium Stay', description: 'Central location with amenities.', inclusions: ['Breakfast', 'Free Wi-Fi'], exclusions: ['Mini Bar'] }],
  others: [],
  itineraryTemplates: []
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('wanderlust_quotes');
    return saved ? JSON.parse(saved) : [];
  });

  const [library, setLibrary] = useState<Library>(() => {
    const saved = localStorage.getItem('wanderlust_library');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_LIBRARY;
    return { ...DEFAULT_LIBRARY, ...parsed, itineraryTemplates: parsed.itineraryTemplates || [] };
  });

  const [remoteLibraryUrl, setRemoteLibraryUrl] = useState<string>(() => {
    return localStorage.getItem('wanderlust_remote_url') || DEFAULT_GIST_URL;
  });

  const [remoteTemplatesUrl, setRemoteTemplatesUrl] = useState<string>(() => {
    return localStorage.getItem('wanderlust_remote_templates_url') || DEFAULT_TEMPLATES_GIST_URL;
  });

  // Persist quotes and library
  useEffect(() => {
    localStorage.setItem('wanderlust_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('wanderlust_library', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem('wanderlust_remote_url', remoteLibraryUrl);
    localStorage.setItem('wanderlust_remote_templates_url', remoteTemplatesUrl);
  }, [remoteLibraryUrl, remoteTemplatesUrl]);

  const fetchGlobalLibrary = useCallback(async (url: string = remoteLibraryUrl, isAutoSync: boolean = false) => {
    if (!url) return;
    let targetUrl = url.trim().split('#')[0];
    if (targetUrl.includes('gist.github.com') && !targetUrl.includes('/raw')) {
      targetUrl = targetUrl.replace('gist.github.com', 'gist.githubusercontent.com') + '/raw';
    }

    try {
      const response = await fetch(targetUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const newLib = data.record || data; 
      
      if (newLib && typeof newLib === 'object') {
        setLibrary(prev => ({ 
          ...prev, 
          ...newLib,
          itineraryTemplates: prev.itineraryTemplates // Keep existing templates during main library sync
        }));
        localStorage.setItem('wanderlust_last_sync_main', Date.now().toString());
        if (!isAutoSync) alert("Master Library synced!");
      }
    } catch (e) {
      if (!isAutoSync) alert(`Failed to sync library.`);
    }
  }, [remoteLibraryUrl]);

  const fetchTemplatesLibrary = useCallback(async (url: string = remoteTemplatesUrl, isAutoSync: boolean = false) => {
    if (!url) return;
    let targetUrl = url.trim().split('#')[0];
    if (targetUrl.includes('gist.github.com') && !targetUrl.includes('/raw')) {
      targetUrl = targetUrl.replace('gist.github.com', 'gist.githubusercontent.com') + '/raw';
    }

    try {
      const response = await fetch(targetUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const templates = Array.isArray(data) ? data : (data.itineraryTemplates || data.templates);
      
      if (Array.isArray(templates)) {
        setLibrary(prev => {
          const existingNames = new Set(prev.itineraryTemplates.map(t => t.name));
          const uniqueNew = templates.filter(t => !existingNames.has(t.name));
          return { ...prev, itineraryTemplates: [...prev.itineraryTemplates, ...uniqueNew] };
        });
        localStorage.setItem('wanderlust_last_sync_templates', Date.now().toString());
        if (!isAutoSync) alert("Saved Trips vault updated from cloud!");
      }
    } catch (e) {
      if (!isAutoSync) alert(`Failed to sync saved trips.`);
    }
  }, [remoteTemplatesUrl]);

  useEffect(() => {
    const checkSync = async () => {
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      
      const lastSyncMain = localStorage.getItem('wanderlust_last_sync_main');
      if (!lastSyncMain || (now - parseInt(lastSyncMain)) > ONE_DAY_MS) {
        await fetchGlobalLibrary(remoteLibraryUrl, true);
      }

      const lastSyncTemplates = localStorage.getItem('wanderlust_last_sync_templates');
      if (!lastSyncTemplates || (now - parseInt(lastSyncTemplates)) > ONE_DAY_MS) {
        await fetchTemplatesLibrary(remoteTemplatesUrl, true);
      }
    };
    checkSync();
  }, [fetchGlobalLibrary, fetchTemplatesLibrary, remoteLibraryUrl, remoteTemplatesUrl]);

  const handleSaveQuote = (quote: Quote) => {
    setQuotes(prev => {
      const existing = prev.find(q => q.id === quote.id);
      return existing ? prev.map(q => q.id === quote.id ? quote : q) : [quote, ...prev];
    });
    setActiveQuote(null);
    setView('dashboard'); 
  };

  const handleDeleteQuote = (id: string) => {
    if (confirm("Are you sure you want to delete this quotation? This action cannot be undone.")) {
      setQuotes(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleUpdateStatus = (id: string, status: QuoteStatus) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  };

  const handlePreviewQuote = (quote: Quote) => {
    setActiveQuote(JSON.parse(JSON.stringify(quote))); 
    setView('preview');
  };

  const handleAddToLibrary = (category: keyof Library, item: string | MasterItem | any) => {
    setLibrary(prev => {
      const list = (prev[category] || []) as any[];
      
      if (category === 'itineraryTemplates') {
        return { ...prev, itineraryTemplates: [...list, item] };
      }

      if (typeof item !== 'string') {
         const existingIdx = (list as MasterItem[]).findIndex(t => t.title === item.title);
         if (existingIdx > -1) {
            const newList = [...list];
            newList[existingIdx] = item;
            return { ...prev, [category]: newList };
         }
         return { ...prev, [category]: [...list, item] };
      }
      const stringList = list as string[];
      if (stringList.includes(item)) return prev;
      return { ...prev, [category]: [...stringList, item] };
    });
  };

  const handleUpdateLibrary = (category: keyof Library, index: number, newValue: string | MasterItem) => {
    setLibrary(prev => {
      const newList = [...(prev[category] as any[])];
      newList[index] = newValue;
      return { ...prev, [category]: newList };
    });
  };

  const handleRemoveFromLibrary = (category: keyof Library, index: number) => {
    setLibrary(prev => ({
      ...prev,
      [category]: (prev[category] as any[]).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {view === 'dashboard' && (
        <Dashboard 
          quotes={quotes} 
          onCreateNew={() => {setActiveQuote(null); setView('builder');}} 
          onSelectQuote={(q) => {setActiveQuote(JSON.parse(JSON.stringify(q))); setView('builder');}} 
          onDeleteQuote={handleDeleteQuote}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
      
      {view === 'builder' && (
        <QuoteBuilder 
          initialQuote={activeQuote}
          library={library}
          remoteUrl={remoteLibraryUrl}
          remoteTemplatesUrl={remoteTemplatesUrl}
          onSave={handleSaveQuote}
          onCancel={() => setView('dashboard')}
          onPreview={handlePreviewQuote}
          onAddToLibrary={handleAddToLibrary}
          onUpdateLibrary={handleUpdateLibrary}
          onRemoveFromLibrary={handleRemoveFromLibrary}
          onSetLibrary={setLibrary}
          onSetRemoteUrl={setRemoteLibraryUrl}
          onSetRemoteTemplatesUrl={setRemoteTemplatesUrl}
          onSyncRemote={() => fetchGlobalLibrary()}
          onSyncTemplates={() => fetchTemplatesLibrary()}
        />
      )}

      {view === 'preview' && activeQuote && (
        <QuotePreview quote={activeQuote} library={library} onBack={() => setView('builder')} />
      )}
    </div>
  );
};

export default App;