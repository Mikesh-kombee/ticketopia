// src/lib/indexeddb.ts
import type { RoutePoint } from './types';

const DB_NAME = 'RoutePlaybackDB';
const DB_VERSION = 1;
const STORE_NAME = 'routes';

interface CachedRoute {
  id: string; // engineerId-date
  data: RoutePoint[];
  timestamp: number; // For cache expiry
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function getCachedRoute(id: string): Promise<RoutePoint[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result ? (request.result as CachedRoute).data : null);
      };
    });
  } catch (error) {
    console.warn("Failed to get cached route from IndexedDB:", error);
    return null; // Gracefully handle IndexedDB unavailability or errors
  }
}

export async function setCachedRoute(id: string, data: RoutePoint[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const cachedEntry: CachedRoute = { id, data, timestamp: Date.now() };
      const request = store.put(cachedEntry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn("Failed to set cached route in IndexedDB:", error);
    // Gracefully handle IndexedDB unavailability or errors
  }
}

export async function clearOldCache(maxAgeDays: number = 7): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const threshold = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (cursor.value.timestamp < threshold) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn("Failed to clear old cache from IndexedDB:", error);
  }
}
