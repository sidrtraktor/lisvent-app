import { useState, useEffect, useCallback } from 'react';
import type { MatchResult, StandardItem } from '../api/client';
import { searchStandardDb } from '../api/client';

/* ===== GREEN ROW ===== */
interface GreenRowProps {
  item: MatchResult;
}

export function GreenRow({ item }: GreenRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-card card-green mb-3 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01]"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status indicator */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Two columns: client -> 1C */}
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Клиент</p>
            <p className="text-xs text-slate-400 truncate">{item.original_name}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-emerald-500/70 mb-0.5">1С</p>
            <p className="text-xs text-slate-200 truncate">{item.matched_name}</p>
          </div>
        </div>

        {/* Quantity */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-emerald-400">
            {item.converted_quantity ?? item.original_quantity}
          </p>
          <p className="text-[10px] text-slate-500">{item.matched_unit}</p>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-700/30">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Оригинал:</span>
              <p className="text-slate-400 mt-0.5">{item.original_name}</p>
              <p className="text-slate-500 mt-0.5">{item.original_quantity} {item.original_unit}</p>
            </div>
            <div>
              <span className="text-emerald-500/70">Найдено в 1С:</span>
              <p className="text-slate-200 mt-0.5">{item.matched_name}</p>
              <p className="text-emerald-400/70 mt-0.5">{item.converted_quantity} {item.matched_unit}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ===== YELLOW ROW ===== */
interface YellowRowProps {
  item: MatchResult;
  onConfirm: (id: number) => void;
}

export function YellowRow({ item, onConfirm }: YellowRowProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(item.id), 300);
  };

  return (
    <div className={`glass-card card-yellow mb-3 overflow-hidden transition-all duration-300 ${confirmed ? 'scale-95 opacity-50' : ''}`}>
      <div className="px-4 py-3">
        {/* Header with status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
              {Math.round(item.confidence * 100)}% совпадение
            </span>
          </div>
          <span className="text-xs text-slate-500">#{item.id}</span>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: Client */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Заявка клиента</p>
            <p className="text-sm text-slate-300 leading-snug">{item.original_name}</p>
            <p className="text-xs text-slate-500 mt-1.5">{item.original_quantity} {item.original_unit}</p>
          </div>

          {/* Right: 1C Match */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <p className="text-[10px] uppercase tracking-wider text-amber-500/70 mb-1.5">Предложение 1С</p>
            <p className="text-sm text-slate-200 leading-snug">{item.matched_name}</p>
            <p className="text-xs text-amber-400/70 mt-1.5">{item.converted_quantity ?? item.original_quantity} {item.matched_unit}</p>
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={confirmed}
          className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 active:scale-[0.98] disabled:opacity-40 transition-all duration-200"
        >
          {confirmed ? 'Подтверждено' : 'Подтвердить совпадение'}
        </button>
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StandardItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

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

  return (
    <div className="glass-card card-red mb-3 overflow-hidden">
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-medium border border-red-500/20">
              Не найдено
            </span>
          </div>
          <span className="text-xs text-slate-500">#{item.id}</span>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: Client */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Заявка клиента</p>
            <p className="text-sm text-slate-300 leading-snug">{item.original_name}</p>
            <p className="text-xs text-slate-500 mt-1.5">{item.original_quantity} {item.original_unit}</p>
          </div>

          {/* Right: Search */}
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
            <p className="text-[10px] uppercase tracking-wider text-red-500/70 mb-1.5">
              {selected ? 'Выбрано из 1С' : 'Найти в справочнике'}
            </p>
            {selected ? (
              <div>
                <p className="text-sm text-slate-200 leading-snug">{selected}</p>
                <button
                  onClick={() => { setSelected(null); setQuery(''); }}
                  className="text-xs text-red-400/70 mt-1.5 hover:text-red-400 transition-colors"
                >
                  Изменить
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                  onFocus={() => setIsOpen(true)}
                  placeholder="Поиск..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                {isOpen && (results.length > 0 || isLoading) && (
                  <div className="absolute z-20 w-full mt-1.5 max-h-40 overflow-y-auto rounded-xl bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 shadow-2xl shadow-black/50">
                    {isLoading ? (
                      <div className="px-3 py-3 text-xs text-slate-500 text-center">
                        <div className="animate-spin w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full mx-auto" />
                      </div>
                    ) : (
                      results.map((dbItem) => (
                        <button
                          key={dbItem.id}
                          onClick={() => {
                            setSelected(dbItem.name);
                            onSelect(item.id, dbItem.name);
                            setIsOpen(false);
                            setQuery(dbItem.name);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
                        >
                          {dbItem.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
