import { useState, useEffect, useCallback } from 'react';
import type { MatchResult, StandardItem } from '../api/client';
import { searchStandardDb } from '../api/client';

interface GreenRowProps {
  item: MatchResult;
}

export function GreenRow({ item }: GreenRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border-l-4 border-emerald-500 bg-emerald-500/5 rounded-lg mb-2 transition-all duration-200"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
            {item.id}
          </span>
          <span className="text-sm text-slate-300 truncate">
            {item.matched_name}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-emerald-400">
            {item.converted_quantity ?? item.original_quantity} {item.matched_unit}
          </span>
          <span className="text-xs text-emerald-500/60">100%</span>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 text-xs text-slate-500 border-t border-slate-700/50">
          <span className="text-slate-600">Оригинал:</span> {item.original_name}
          {' '}({item.original_quantity} {item.original_unit})
        </div>
      )}
    </div>
  );
}

interface YellowRowProps {
  item: MatchResult;
  onConfirm: (id: number) => void;
}

export function YellowRow({ item, onConfirm }: YellowRowProps) {
  return (
    <div className="border-l-4 border-amber-500 bg-amber-500/5 rounded-lg mb-2">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
            {item.id}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
            {Math.round(item.confidence * 100)}% совпадение
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 text-sm mb-3">
          <div>
            <span className="text-slate-500 text-xs">Клиент:</span>
            <p className="text-slate-300">{item.original_name}</p>
            <p className="text-slate-500 text-xs">
              {item.original_quantity} {item.original_unit}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-xs">Предложение 1С:</span>
            <p className="text-blue-300">{item.matched_name}</p>
            <p className="text-slate-500 text-xs">
              {item.converted_quantity ?? item.original_quantity} {item.matched_unit}
            </p>
          </div>
        </div>
        <button
          onClick={() => onConfirm(item.id)}
          className="w-full py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 active:bg-amber-500/40 transition-colors"
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
}

interface RedRowProps {
  item: MatchResult;
  onSelect: (id: number, name: string) => void;
}

export function RedRow({ item, onSelect }: RedRowProps) {
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

  return (
    <div className="border-l-4 border-red-500 bg-red-500/5 rounded-lg mb-2">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
            {item.id}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
            Не найдено
          </span>
        </div>
        <div className="mb-3">
          <span className="text-slate-500 text-xs">Клиент:</span>
          <p className="text-sm text-slate-300">{item.original_name}</p>
          <p className="text-xs text-slate-500">
            {item.original_quantity} {item.original_unit}
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Поиск по справочнику 1С..."
            className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {isOpen && (results.length > 0 || isLoading) && (
            <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-slate-500">
                  Поиск...
                </div>
              ) : (
                results.map((dbItem) => (
                  <button
                    key={dbItem.id}
                    onClick={() => {
                      onSelect(item.id, dbItem.name);
                      setQuery(dbItem.name);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    {dbItem.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
