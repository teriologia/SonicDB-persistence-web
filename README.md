# @teriologia/sonicdb-persistence-web

**Persistence Plugin for Web and Browser Environments (IndexedDB)**

`@teriologia/sonicdb-persistence-web` provides reliable, asynchronous persistence for your SonicDB data when running inside a web browser (React, Vue, Angular, Vanilla JS).

It utilizes the browser's built-in **IndexedDB API** for high capacity, speed, and asynchronous I/O, ensuring zero-dependency integration and preventing UI freezing.

---

## ✨ Features

* **Zero External Dependencies:** Built entirely on native browser APIs (IndexedDB).
* **High Performance:** Asynchronous I/O prevents main thread blocking.
* **High Capacity:** Stores data well beyond `localStorage` limits.
* **Dual Package Support:** Compatible with both ESM (import) and CJS (require).

---

## 🚀 Installation

```bash
npm install @teriologia/sonicdb @teriologia/sonicdb-persistence-web
```

---
## ⚠️ Developer Note: When to Save

**Best Practice**: This plugin does not auto-save on every create, update, or delete operation. This is an intentional design choice to maintain the high performance of the core engine.

 For production use, you should decide when to save based on your application's needs:

*  **Periodically**: Use setInterval to call db.save() every few seconds.

*  **After Bulk Operations**: Call db.save() once after a batch of data has been imported or modified.

*  **On Server Shutdown**: Ensure db.save() is called when your Node.js process receives a termination signal (SIGINT, SIGTERM).
---

## 👨‍💻 How to Use (JS Example)

**Step 1: Initialize, Use Plugin, and Load Data**

The loadPersistentData() method is crucial as it reads the existing file from disk and rebuilds the in-memory indexes of SonicDB.

  **Import**
```typescript
import { IndexedDBPersistence } from '@teriologia/sonicdb-persistence-web'; //recommended
//const { IndexedDBPersistence } = require('@teriologia/sonicdb-persistence-web'); //for commonJS
````
  **Usage**
```typescript
  const persistencePlugin = new IndexedDBPersistence('MyAppDB');
    
  const db = new SonicDB({ indexOn: ['email'] });
  db.usePersistence(persistencePlugin); 

  // Load Existing Data
  // Returns true if data was found and successfully loaded, false otherwise.
  await db.loadPersistentData();
```

**Step 2: Save Data**

Manually Save (Critical Step!)

```typescript
  await db.save();
```
