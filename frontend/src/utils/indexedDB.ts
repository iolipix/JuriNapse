// Utilitaire pour gérer IndexedDB et préserver tous les messages
class IndexedDBManager {
  private dbName = 'JuriNapseDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store pour les messages
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('groupId', 'groupId', { unique: false });
          messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store pour les groupes
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }

        // Store pour les posts (backup)
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('authorId', 'authorId', { unique: false });
        }

        // Store pour les dossiers (backup)
        if (!db.objectStoreNames.contains('folders')) {
          const foldersStore = db.createObjectStore('folders', { keyPath: 'id' });
          foldersStore.createIndex('authorId', 'authorId', { unique: false });
        }
      };
    });
  }

  async saveMessages(messages: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      // Sauvegarder tous les messages
      messages.forEach(message => {
        store.put(message);
      });
    });
  }

  async loadMessages(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveGroups(groups: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['groups'], 'readwrite');
      const store = transaction.objectStore('groups');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      groups.forEach(group => {
        store.put(group);
      });
    });
  }

  async loadGroups(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['groups'], 'readonly');
      const store = transaction.objectStore('groups');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async savePosts(posts: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      posts.forEach(post => {
        store.put(post);
      });
    });
  }

  async loadPosts(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveFolders(folders: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['folders'], 'readwrite');
      const store = transaction.objectStore('folders');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      folders.forEach(folder => {
        store.put(folder);
      });
    });
  }

  async loadFolders(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['folders'], 'readonly');
      const store = transaction.objectStore('folders');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

export const indexedDBManager = new IndexedDBManager();