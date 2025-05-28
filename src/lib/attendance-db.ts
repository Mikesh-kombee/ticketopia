
import type { AttendanceLog } from './types';

const DB_NAME = 'TicketopiaAttendanceDB';
const DB_VERSION = 1;
const STORE_NAME = 'attendance_logs';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not supported."));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
        dbPromise = null; // Reset promise on error
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('logId', 'logId', { unique: true });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
      };
    });
  }
  return dbPromise;
}

export async function addAttendanceLog(log: Omit<AttendanceLog, 'id'>): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(log);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as number);
  });
}

export async function updateAttendanceLog(log: AttendanceLog): Promise<void> {
  if (log.id === undefined) return Promise.reject("Log ID is required for update.");
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(log);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}


export async function getAttendanceLogByLogId(logId: string): Promise<AttendanceLog | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('logId');
    const request = index.get(logId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as AttendanceLog | undefined);
  });
}

export async function getPendingAttendanceLogs(): Promise<AttendanceLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('syncStatus');
    const request = index.getAll('pending');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as AttendanceLog[]);
  });
}

export async function getAllAttendanceLogs(): Promise<AttendanceLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as AttendanceLog[]);
  });
}
