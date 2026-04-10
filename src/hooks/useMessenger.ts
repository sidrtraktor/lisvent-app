/**
 * Абстракция мессенджера: Telegram / Max.
 * Сейчас работает с Telegram WebApp SDK.
 * Для переключения на Max — заменить реализацию внутри,
 * компоненты менять не нужно.
 */

interface MessengerUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

interface MessengerAPI {
  init: () => void;
  close: () => void;
  ready: () => void;
  expand: () => void;
  sendData: (data: string) => void;
  getUserInfo: () => MessengerUser | null;
  getInitData: () => string;
  getStartParam: () => string | null;
  getColorScheme: () => 'light' | 'dark';
  showConfirm: (message: string) => Promise<boolean>;
  isAvailable: boolean;
}

// TypeScript-тайпинг для window.Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          start_param?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        colorScheme: 'light' | 'dark';
        close: () => void;
        ready: () => void;
        expand: () => void;
        sendData: (data: string) => void;
        showConfirm: (
          message: string,
          callback: (confirmed: boolean) => void,
        ) => void;
      };
    };
  }
}

function createTelegramBridge(): MessengerAPI {
  const tg = window.Telegram?.WebApp;
  const isAvailable = !!tg;

  return {
    isAvailable,

    init() {
      if (tg) {
        tg.ready();
        tg.expand();
      }
    },

    close() {
      tg?.close();
    },

    ready() {
      tg?.ready();
    },

    expand() {
      tg?.expand();
    },

    sendData(data: string) {
      tg?.sendData(data);
    },

    getUserInfo(): MessengerUser | null {
      const user = tg?.initDataUnsafe?.user;
      if (!user) return null;
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
      };
    },

    getInitData(): string {
      return tg?.initData || '';
    },

    getStartParam(): string | null {
      return tg?.initDataUnsafe?.start_param || null;
    },

    getColorScheme(): 'light' | 'dark' {
      return tg?.colorScheme || 'dark';
    },

    async showConfirm(message: string): Promise<boolean> {
      if (!tg) return true;
      return new Promise((resolve) => {
        tg.showConfirm(message, resolve);
      });
    },
  };
}

// Функции для MAX
function createMaxBridge(): MessengerAPI {
  // @ts-ignore
  const max = window.WebApp;
  const isAvailable = !!max;

  return {
    isAvailable,

    init() {
      // MAX WebApp инициализируется сам, но можно вызвать expand если мы найдем аналог
      // В доках нет метода expand и ready для MAX? Мы просто оставим пустыми если их нет.
    },

    close() {
      // @ts-ignore
      max?.close?.();
    },

    ready() {
    },

    expand() {
    },

    sendData(data: string) {
      // @ts-ignore
      max?.sendData?.(data);
    },

    getUserInfo(): MessengerUser | null {
      // @ts-ignore
      const user = max?.initDataUnsafe?.user;
      if (!user) return null;
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
      };
    },

    getInitData(): string {
      // @ts-ignore
      return max?.initData || '';
    },

    getStartParam(): string | null {
      // @ts-ignore
      return max?.initDataUnsafe?.start_param || null;
    },

    getColorScheme(): 'light' | 'dark' {
      // В MAX пока может не быть colorScheme, ставим dark по дефолту
      // @ts-ignore
      return max?.colorScheme || 'dark';
    },

    async showConfirm(message: string): Promise<boolean> {
      if (!max) return true;
      return new Promise((resolve) => {
        // У MAX есть showAlert или showConfirm? Если нет нативный confirm:
        // @ts-ignore
        if (max.showConfirm) {
          // @ts-ignore
          max.showConfirm(message, resolve);
        } else {
          resolve(window.confirm(message));
        }
      });
    },
  };
}

// Экспорт единственного экземпляра
// Логика: если есть MAX - берем его, иначе Telegram
// @ts-ignore
export const messenger: MessengerAPI = typeof window !== 'undefined' && window.WebApp && window.WebApp.initData
  ? createMaxBridge()
  : createTelegramBridge();

export type { MessengerAPI, MessengerUser };
