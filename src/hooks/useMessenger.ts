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

// Будущее: createMaxBridge() для Max Messenger
// function createMaxBridge(): MessengerAPI { ... }

// Экспорт единственного экземпляра
export const messenger: MessengerAPI = createTelegramBridge();
export type { MessengerAPI, MessengerUser };
