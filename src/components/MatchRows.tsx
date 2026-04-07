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

/* ===== Inline Search (shared) ===== */
function InlineSearch({
  onSelect,
  onCancel,
  borderColor = 'amber',
}: {
  onSelect: (name: string) => void;
  onCancel: () => void;
  borderColor?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StandardItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
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

  const borderClasses: Record<string, string> = {
    amber: 'border-amber-500/30 focus:border-amber-400 placeholder-amber-400/40',
    red: 'border-red-500/30 focus:border-red-400 placeholder-red-400/40',
  };

  return (
    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
      <div className="relative w-full text-left">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          autoFocus
          placeholder="Найти в справочнике..."
          className={`w-full px-2 py-1 rounded bg-slate-800/80 border text-xs text-slate-200 focus:outline-none transition-all h-[28px] ${borderClasses[borderColor] || borderClasses.amber}`}
        />
        {isOpen && (results.length > 0 || isLoading || query.length > 0) && (
          <div className="absolute z-50 w-[220px] right-0 top-[32px] max-h-48 overflow-y-auto rounded-md bg-slate-800 border border-slate-600 shadow-xl ring-1 ring-black/50">
            {isLoading ? (
              <div className="px-3 py-3 text-center text-xs text-slate-400">Поиск...</div>
            ) : results.length > 0 ? (
              results.map((dbItem) => (
                <button
                  key={dbItem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(dbItem.name);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                >
                  {dbItem.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-center text-xs text-slate-500">Не найдено</div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              className="w-full text-center px-2 py-1 text-[10px] text-slate-400 bg-slate-900/50 hover:bg-slate-700 border-t border-slate-600"
            >
              Отмена
            </button>
          </div>
        )}
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
    <div className="match-row" style={{ borderLeftColor: 'var(--clr-green)' }}>
      {/* Left: client */}
      <div
        className="match-left"
        onClick={(e) => copy('client', item.original_name, e)}
      >
        {copiedId === 'client' && <span className="copy-flash">OK</span>}
        <span className="match-name">{item.original_name}</span>
        <span className="match-qty">{item.original_quantity} {item.original_unit}</span>
      </div>

      {/* Right: 1C match */}
      <div className="match-right">
        <div
          className="match-right-text"
          onClick={(e) => copy('1c', item.matched_name || '', e)}
        >
          {copiedId === '1c' && <span className="copy-flash">OK</span>}
          <span className="match-name-1c green">{item.matched_name}</span>
          <span className="match-qty-1c">{item.converted_quantity ?? item.original_quantity} {item.matched_unit}</span>
        </div>
        <div className="match-actions">
          <span className="match-pct green">{Math.round(item.confidence * 100)}%</span>
          <SourceTag source={item.verified_by} />
        </div>
      </div>
    </div>
  );
}

/* ===== YELLOW ROW ===== */
interface YellowRowProps {
  item: MatchResult;
  onConfirm: (id: number, approvedName?: string, approvedQty?: number) => void;
}

export function YellowRow({ item, onConfirm }: YellowRowProps) {
  const { copiedId, copy } = useCopier();
  const [confirmed, setConfirmed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(item.id), 300);
  };

  return (
    <div
      className={`match-row ${confirmed ? 'confirmed' : ''}`}
      style={{ borderLeftColor: 'var(--clr-yellow)' }}
    >
      {/* Left: client */}
      <div
        className="match-left"
        onClick={(e) => copy('client', item.original_name, e)}
      >
        {copiedId === 'client' && <span className="copy-flash">OK</span>}
        <span className="match-name">{item.original_name}</span>
        <span className="match-qty">{item.original_quantity} {item.original_unit}</span>
      </div>

      {/* Right: 1C match */}
      <div className="match-right">
        {isEditing ? (
          <InlineSearch
            borderColor="amber"
            onSelect={(name) => {
              onConfirm(item.id, name, 1);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div
              className="match-right-text"
              onClick={(e) => copy('1c', item.matched_name || '', e)}
            >
              {copiedId === '1c' && <span className="copy-flash">OK</span>}
              <span className="match-name-1c yellow">{item.matched_name}</span>
              <span className="match-qty-1c">{item.converted_quantity ?? item.original_quantity} {item.matched_unit}</span>
            </div>
            <div className="match-actions">
              <span className="match-pct yellow">{Math.round(item.confidence * 100)}%</span>
              <button className="btn-ok" onClick={handleConfirm} disabled={confirmed}>
                {confirmed ? 'OK' : 'OK'}
              </button>
              <button className="btn-replace yellow" onClick={() => setIsEditing(true)}>
                Заменить
              </button>
            </div>
          </>
        )}
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
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="match-row" style={{ borderLeftColor: 'var(--clr-red)' }}>
      {/* Left: client */}
      <div
        className="match-left"
        onClick={(e) => copy('client', item.original_name, e)}
      >
        {copiedId === 'client' && <span className="copy-flash">OK</span>}
        <span className="match-name">{item.original_name}</span>
        <span className="match-qty">{item.original_quantity} {item.original_unit}</span>
      </div>

      {/* Right: 1C match or empty */}
      <div className="match-right">
        {isEditing ? (
          <InlineSearch
            borderColor="red"
            onSelect={(name) => {
              onSelect(item.id, name);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div
              className="match-right-text"
              onClick={(e) => {
                if (item.matched_name) copy('1c', item.matched_name, e);
              }}
            >
              {copiedId === '1c' && <span className="copy-flash">OK</span>}
              {item.matched_name ? (
                <span className="match-name-1c red">{item.matched_name}</span>
              ) : (
                <span className="match-name-1c empty">Нет совпадений</span>
              )}
            </div>
            <div className="match-actions">
              {item.confidence > 0 && (
                <span className="match-pct red">{Math.round(item.confidence * 100)}%</span>
              )}
              <button className="btn-replace red" onClick={() => setIsEditing(true)}>
                Заменить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== SOURCE TAG ===== */
function SourceTag({ source }: { source: string | null | undefined }) {
  if (!source) return null;

  const map: Record<string, { label: string; cls: string }> = {
    ai: { label: 'ИИ', cls: 'tag-ai' },
    cache: { label: 'Кэш', cls: 'tag-cache' },
    mapping: { label: 'Словарь', cls: 'tag-mapping' },
    fuzzy: { label: 'Подбор', cls: 'tag-fuzzy' },
    vector: { label: 'Вектор', cls: 'tag-vector' },
  };

  const info = map[source];
  if (!info) return null;

  return <span className={`source-tag ${info.cls}`}>{info.label}</span>;
}
