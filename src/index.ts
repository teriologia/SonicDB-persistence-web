import { PersistencePlugin, Document } from '@teriologia/sonicdb';

const DB_NAME = 'SonicDBStore';
const STORE_NAME = 'documents';
const DB_VERSION = 1;
const DATA_KEY = 'sonicdb_snapshot';

export class IndexedDBPersistence<T extends Document> implements PersistencePlugin<T> {
    public name = "IndexedDBPersistence";
    private db: IDBDatabase | null = null;
    private isSupported: boolean;
    
    constructor(private dbName: string = DB_NAME) {
        // SSR (Server Side Rendering) kontrolü: window veya indexedDB yoksa pasif moda geç.
        this.isSupported = typeof window !== 'undefined' && !!(
            window.indexedDB || 
            (window as any).mozIndexedDB || 
            (window as any).webkitIndexedDB || 
            (window as any).msIndexedDB
        );

        if (!this.isSupported) {
            console.warn("[SonicDB Web Persistence] IndexedDB is not available in this environment. Persistence is disabled.");
        }
    }

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (!this.isSupported) {
                return reject(new Error("IndexedDB not supported"));
            }
            if (this.db) {
                return resolve(this.db);
            }
            
            const idb = window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB || (window as any).msIndexedDB;
            const request = idb.open(this.dbName, DB_VERSION);
            
            request.onupgradeneeded = (event: any) => {
                const db = event.target.result as IDBDatabase;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };

            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                resolve(this.db!);
            };

            request.onerror = (event: any) => {
                reject(new Error(`IndexedDB open error: ${event.target.errorCode}`));
            };
        });
    }

    async loadData(): Promise<T[] | null> {
        if (!this.isSupported) return null;

        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                
                const getRequest = store.get(DATA_KEY);

                getRequest.onsuccess = () => {
                    const record = getRequest.result;
                    if (!record || !record.data) {
                        resolve(null); // Veri yok
                    } else {
                        try {
                            resolve(JSON.parse(record.data) as T[]);
                        } catch (e) {
                            reject(new Error("Failed to parse stored JSON data"));
                        }
                    }
                };

                getRequest.onerror = () => reject(new Error("Failed to retrieve data from IndexedDB"));
            });
        } catch (error) {
            console.error("[SonicDB Web Persistence] Load Failed:", error);
            return null;
        }
    }
    async saveData(data: (T | null)[]): Promise<void> {
        if (!this.isSupported) return;

        const db = await this.openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const dataToSave = JSON.stringify(data.filter(doc => doc !== null));
            const record = { key: DATA_KEY, data: dataToSave };

            const request = store.put(record);

            request.onsuccess = () => resolve();
            request.onerror = (event: any) => reject(new Error(`IndexedDB save error: ${event.target.errorCode}`));
        });
    }
}