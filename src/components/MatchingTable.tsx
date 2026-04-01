import { useState, useEffect } from 'react';
import type { MatchResult, SessionData } from '../api/client';
import {
  fetchSession,
  approveSession,
  createDemoSession as apiCreateDemo,
} from '../api/client';
import { messenger } from '../hooks/useMessenger';
import { GreenRow, YellowRow, RedRow } from './MatchRows';

export function MatchingTable() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [items, setItems] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  const sessionId =
    new URLSearchParams(window.location.search).get('session_id') || '';

  const handleCreateDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCreateDemo();
      window.location.search = `?session_id=${data.session_id}`;
    } catch {
      setError('Не удалось создать тестовую сессию. Запущен ли бэкенд?');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    fetchSession(sessionId)
      .then((data) => {
        setSession(data);
        setItems(data.items);
        setApproved(data.approved);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleConfirmYellow = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'green' as const,
              approved_name: item.matched_name,
              approved_quantity: item.converted_quantity ?? item.original_quantity,
            }
          : item,
      ),
    );
  };

  const handleSelectRed = (id: number, name: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'yellow' as const,
              matched_name: name,
              approved_name: name,
            }
          : item,
      ),
    );
  };

  const handleApprove = async () => {
    if (!sessionId) return;
    const hasRed = items.some((i) => i.status === 'red');
    if (hasRed) {
      const confirmed = await messenger.showConfirm(
        'Есть позиции без соответствия. Продолжить?',
      );
      if (!confirmed) return;
    }
    setApproving(true);
    try {
      const initData = messenger.getInitData();
      await approveSession(sessionId, items, initData);
      setApproved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка утверждения');
    } finally {
      setApproving(false);
    }
  };

  const green = items.filter((i) => i.status === 'green').length;
  const yellow = items.filter((i) => i.status === 'yellow').length;
  const red = items.filter((i) => i.status === 'red').length;

  /* === LOADING === */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Загрузка сессии...</p>
        </div>
      </div>
    );
  }

  /* === NO SESSION ID === */
  if (!sessionId && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="glass-card p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">LisVent</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Сопоставление номенклатуры<br />
            Откройте через бот или создайте тест
          </p>
          <button
            onClick={handleCreateDemo}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
          >
            Создать тестовую сессию
          </button>
        </div>
      </div>
    );
  }

  /* === ERROR === */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="glass-card p-8 text-center max-w-sm w-full border-red-500/20">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-400 font-semibold mb-2">Ошибка</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  /* === APPROVED === */
  if (approved) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="glass-card p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-emerald-400 text-xl font-bold mb-2">Заказ утвержден!</p>
          <p className="text-slate-400 text-sm mb-6">
            Excel-файл отправлен в чат
          </p>
          <button
            onClick={() => messenger.close()}
            className="px-8 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-600/50 transition-all border border-slate-600/30"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  /* === MAIN TABLE === */
  const handleCopyTable = async () => {
    const header = "Заявка\tКол-во\tЕд.изм.\tНайдено 1С\tКол-во 1С\tФормат 1С\tСтатус";
    const tsv = [
      header,
      ...items.map(i => {
        const status = i.status === 'green' ? 'OK' : i.status === 'yellow' ? 'AI' : 'NOT FOUND';
        const qty1c = i.converted_quantity ?? i.original_quantity ?? '';
        const unit1c = i.matched_unit ?? '';
        return `${i.original_name}\t${i.original_quantity}\t${i.original_unit}\t${i.matched_name || ''}\t${qty1c}\t${unit1c}\t${status}`;
      })
    ].join('\n');
    
    try {
      await navigator.clipboard.writeText(tsv);
      alert('Таблица скопирована в буфер обмена!'); // Simple fallback for now
    } catch {
      alert('Ошибка копирования');
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-36">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-slate-700/30 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-slate-100 tracking-tight">
            {session?.client_name || 'Заказ'}
          </h1>
          <span className="text-[11px] text-slate-500 font-mono">
            #{session?.session_id}
          </span>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 mt-2.5">
          <StatusBadge color="emerald" count={green} label="OK" />
          <StatusBadge color="amber" count={yellow} label="Проверить" />
          <StatusBadge color="red" count={red} label="Не найдено" />
          <span className="text-[11px] text-slate-500 ml-auto font-medium">
            {items.length} позиций
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 p-3">
        {items.filter((i) => i.status === 'red').map((item) => (
          <RedRow key={`r-${item.id}`} item={item} onSelect={handleSelectRed} />
        ))}
        {items.filter((i) => i.status === 'yellow').map((item) => (
          <YellowRow key={`y-${item.id}`} item={item} onConfirm={handleConfirmYellow} />
        ))}
        {items.filter((i) => i.status === 'green').map((item) => (
          <GreenRow key={`g-${item.id}`} item={item} />
        ))}
      </div>

      {/* Sticky footer buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/90 backdrop-blur-xl border-t border-slate-700/30 flex flex-col gap-3">
        <button
          onClick={handleApprove}
          disabled={approving}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/20"
        >
          {approving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Отправка...
            </span>
          ) : (
            'Утвердить и отправить в 1С'
          )}
        </button>
        <button
          onClick={handleCopyTable}
          className="w-full py-3 rounded-xl font-medium text-sm bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Скопировать таблицу
        </button>
      </div>
    </div>
  );
}


/* === Status Badge === */
function StatusBadge({ color, count, label }: { color: string; count: number; label: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const dotColors: Record<string, string> = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
  };

  if (count === 0) return null;

  return (
    <span className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border font-medium ${colors[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
      {count} {label}
    </span>
  );
}
