import { useState, useEffect, useCallback } from 'react';
import type { MatchResult, StandardItem } from '../api/client';
import { searchStandardDb } from '../api/client';

/* ===== COPY HELPER ===== */
function useCopier() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // fallback
    }
  };

  return { copiedId, copy };
}

/* ===== Toast Hint ===== */
function CopyToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 z-50 pointer-events-none">
      <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
        Скопировано!
      </div>
    </div>
  );
}

/* ===== GREEN ROW ===== */
interface GreenRowProps {
  item: MatchResult;
}

export function GreenRow({ item }: GreenRowProps) {
  const { copiedId, copy } = useCopier();


  return (
    <div className="glass-card card-green mb-2 overflow-visible relative group">
      <div className="flex w-full min-h-[60px]">
        {/* Колонки с позициями */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-700/30">
          {/* Колонка 1: Заявка */}
          <div 
            className="py-3 pr-2 flex flex-col justify-center cursor-pointer hover:bg-slate-800/50 active:bg-slate-800/80 transition-colors relative"
            style={{ paddingLeft: '6px' }}
            onClick={(e) => copy('client', item.original_name, e)}
          >
            <CopyToast show={copiedId === 'client'} />
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Заявка клиента</p>
            <p className="text-[13px] text-slate-300 font-medium leading-tight">{item.original_name}</p>
            <p className="text-[10px] text-slate-500 mt-1">{item.original_quantity} {item.original_unit}</p>
          </div>
          
          {/* Колонка 2: 1С */}
          <div 
            className="py-3 pl-3 pr-4 flex flex-col justify-center cursor-pointer hover:bg-emerald-500/5 active:bg-emerald-500/10 transition-colors relative"
            onClick={(e) => copy('1c', item.matched_name || '', e)}
          >
            <CopyToast show={copiedId === '1c'} />
            <p className="text-[9px] uppercase tracking-wider text-emerald-500/70 mb-0.5">Предложение 1С</p>
            <p className="text-[13px] text-emerald-100 font-medium leading-tight">{item.matched_name}</p>
            <p className="text-[10px] text-emerald-400/80 mt-1 font-bold">{item.converted_quantity ?? item.original_quantity} {item.matched_unit}</p>
          </div>
        </div>

        {/* Колонка 3: Статус (Узкая) */}
        <div className="w-[36px] shrink-0 border-l border-slate-700/30 flex flex-col items-center justify-center bg-emerald-500/5" title="Точное совпадение">
          <svg className="w-5 h-5 text-emerald-400 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ===== YELLOW ROW ===== */
interface YellowRowProps {
  item: MatchResult;
  onConfirm: (id: number) => void;
}

export function YellowRow({ item, onConfirm }: YellowRowProps) {
  const { copiedId, copy } = useCopier();

  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(item.id), 300);
  };

  return (
    <div className={`glass-card card-yellow mb-2 overflow-visible relative transition-all duration-300 ${confirmed ? 'scale-95 opacity-50' : ''}`}>
      <div className="flex w-full min-h-[60px]">
        {/* Колонки с позициями */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-700/30">
          {/* Колонка 1: Заявка */}
          <div 
            className="py-3 pr-2 flex flex-col justify-center cursor-pointer hover:bg-slate-800/50 active:bg-slate-800/80 transition-colors relative"
            style={{ paddingLeft: '6px' }}
            onClick={(e) => copy('client', item.original_name, e)}
          >
            <CopyToast show={copiedId === 'client'} />
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Заявка клиента</p>
            <p className="text-[13px] text-slate-300 font-medium leading-tight">{item.original_name}</p>
            <p className="text-[10px] text-slate-500 mt-1">{item.original_quantity} {item.original_unit}</p>
          </div>
          
          {/* Колонка 2: 1С */}
          <div 
            className="py-3 pl-3 pr-4 flex flex-col justify-center cursor-pointer hover:bg-amber-500/5 active:bg-amber-500/10 transition-colors relative"
            onClick={(e) => copy('1c', item.matched_name || '', e)}
          >
            <CopyToast show={copiedId === '1c'} />
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[9px] uppercase tracking-wider text-amber-500/80 font-bold">ИИ-Подбор 1С</p>
              <span className="text-[9px] font-bold text-amber-900 bg-amber-400 px-1 py-[1px] rounded leading-none">{Math.round(item.confidence * 100)}%</span>
            </div>
            <p className="text-[13px] text-amber-100 font-medium leading-tight">{item.matched_name}</p>
            <p className="text-[10px] text-amber-400/80 mt-1 font-bold">{item.converted_quantity ?? item.original_quantity} {item.matched_unit}</p>
          </div>
        </div>

        {/* Колонка 3: Статус (Узкая) */}
        <div 
          onClick={handleConfirm}
          className={`w-[48px] shrink-0 border-l border-slate-700/30 flex flex-col items-center justify-center transition-colors cursor-pointer ${confirmed ? 'bg-emerald-500/10' : 'bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30'}`}
          title="Подтвердить совпадение"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${confirmed ? 'bg-emerald-500/20 shadow-emerald-500/20' : 'bg-amber-500/20 shadow-amber-500/20 animate-pulse'}`}>
            <svg className={`w-4 h-4 ${confirmed ? 'text-emerald-400' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {!confirmed && <span className="text-[8px] text-amber-500/80 font-bold mt-1 uppercase">ОК?</span>}
        </div>
      </div>
    </div>
  );
}

/* ===== RED ROW ===== */
interface RedRowProps {
  item: MatchResult;
  onSelect: (id: number, name: string) => void;
}

export function RedRow({ item, onSelect }: RedRowProps) {
  const { copiedId, copy } = useCopier();

  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StandardItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchStandardDb(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleDropdownOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <div className="glass-card card-red mb-2 overflow-visible relative">
      <div className="flex w-full min-h-[60px]">
        {/* Колонки с позициями */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-700/30">
          {/* Колонка 1: Заявка */}
          <div 
            className="py-3 pr-2 flex flex-col justify-center cursor-pointer hover:bg-slate-800/50 active:bg-slate-800/80 transition-colors relative"
            style={{ paddingLeft: '6px' }}
            onClick={(e) => copy('client', item.original_name, e)}
          >
            <CopyToast show={copiedId === 'client'} />
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Заявка клиента</p>
            <p className="text-[13px] text-slate-300 font-medium leading-tight">{item.original_name}</p>
            <p className="text-[10px] text-slate-500 mt-1">{item.original_quantity} {item.original_unit}</p>
          </div>
          
          {/* Колонка 2: 1С (Dropdown / Интерактивная) */}
          <div className="p-2 flex flex-col justify-center bg-red-500/5 relative cursor-pointer" onClick={handleDropdownOpen}>
            <p className="text-[9px] uppercase tracking-wider text-red-400/80 font-bold mb-1">Выбрать позицию 1С</p>
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                placeholder="Найти в справочнике..."
                className="w-full px-2 py-1.5 rounded bg-slate-800/80 border border-red-500/30 text-xs text-slate-200 placeholder-red-400/40 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/50 transition-all font-medium h-[28px]"
              />
              {/* Dropdown list */}
              {isOpen && (results.length > 0 || isLoading || query.length > 0) && (
                <div className="absolute z-50 w-[220px] sm:w-full right-0 sm:left-0 top-[32px] max-h-48 overflow-y-auto rounded-md bg-slate-800 border border-slate-600 shadow-xl shadow-black/80 ring-1 ring-black/50">
                  {isLoading ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">Поиск...</div>
                  ) : results.length > 0 ? (
                    results.map((dbItem) => (
                      <button
                        key={dbItem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item.id, dbItem.name);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0 leading-tight"
                      >
                        {dbItem.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-slate-500 border-t border-slate-700/30">
                      Не найдено
                    </div>
                  )}
                  {/* Опция закрыть */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    className="w-full text-center px-2 py-1 text-[10px] text-slate-400 bg-slate-900/50 hover:bg-slate-700 border-t border-slate-600"
                  >
                    Закрыть
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Колонка 3: Статус (Узкая) */}
        <div 
          className="w-[36px] shrink-0 border-l border-slate-700/30 flex flex-col items-center justify-center bg-red-500/5 cursor-pointer hover:bg-red-500/10 active:bg-red-500/20 transition-colors" 
          title="Открыть поиск"
          onClick={handleDropdownOpen}
        >
          <svg className="w-5 h-5 text-red-500 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
