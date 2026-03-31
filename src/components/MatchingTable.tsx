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

  // Извлечь session_id из URL
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
        'Есть позиции без соответствия (красные). Продолжить?',
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

  // Статистика
  const green = items.filter((i) => i.status === 'green').length;
  const yellow = items.filter((i) => i.status === 'yellow').length;
  const red = items.filter((i) => i.status === 'red').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-400 text-lg">
          Загрузка сессии...
        </div>
      </div>
    );
  }

  if (!sessionId && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center max-w-sm">
          <h1 className="text-xl font-semibold text-slate-200 mb-2">LisVent</h1>
          <p className="text-slate-400 text-sm mb-6">
            Откройте через бот или создайте тестовую сессию.
          </p>
          <button
            onClick={handleCreateDemo}
            className="px-6 py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg"
          >
            Создать тестовую сессию
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 text-lg font-medium mb-2">Ошибка</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (approved) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">&#10003;</div>
          <p className="text-emerald-400 text-lg font-medium mb-2">
            Заказ утвержден!
          </p>
          <p className="text-slate-400 text-sm">
            Файл отправлен в чат. Можете закрыть это окно.
          </p>
          <button
            onClick={() => messenger.close()}
            className="mt-4 px-6 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
        <h1 className="text-base font-semibold text-slate-200">
          {session?.client_name || 'Заказ'}
        </h1>
        <div className="flex gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">{green}</span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">{yellow}</span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">{red}</span>
          </span>
          <span className="text-xs text-slate-500 ml-auto">
            {items.length} позиций
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 p-3 space-y-1">
        {/* Красные первыми — требуют действия */}
        {items
          .filter((i) => i.status === 'red')
          .map((item) => (
            <RedRow key={item.id} item={item} onSelect={handleSelectRed} />
          ))}

        {/* Желтые — быстрая проверка */}
        {items
          .filter((i) => i.status === 'yellow')
          .map((item) => (
            <YellowRow
              key={item.id}
              item={item}
              onConfirm={handleConfirmYellow}
            />
          ))}

        {/* Зеленые — OK */}
        {items
          .filter((i) => i.status === 'green')
          .map((item) => (
            <GreenRow key={item.id} item={item} />
          ))}
      </div>

      {/* Sticky кнопка */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
        <button
          onClick={handleApprove}
          disabled={approving}
          className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
        >
          {approving ? 'Отправка...' : 'Утвердить и отправить в 1С'}
        </button>
      </div>
    </div>
  );
}
