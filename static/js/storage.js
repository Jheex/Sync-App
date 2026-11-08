
const SyncStorage = (() => {

    const DB_NAME = "sync_database";
    const DB_VERSION = 1;
    const STORE_NAME = "events";

    function openDatabase() {
        return new Promise((resolve, reject) => {

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, {
                        keyPath: "id"
                    });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

        });
    }

    function transactionComplete(transaction) {
        return new Promise((resolve, reject) => {

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);

        });
    }

    async function getEvents() {

        const database = await openDatabase();

        try {
            return await new Promise((resolve, reject) => {

                const transaction = database.transaction(STORE_NAME, "readonly");
                const request = transaction.objectStore(STORE_NAME).getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);

            });
        } finally {
            database.close();
        }
    }

    async function saveEvent(event) {

        const database = await openDatabase();

        try {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            const completion = transactionComplete(transaction);

            transaction.objectStore(STORE_NAME).put(event);

            await completion;
        } finally {
            database.close();
        }
    }

    async function deleteEvent(id) {

        const database = await openDatabase();

        try {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            const completion = transactionComplete(transaction);

            transaction.objectStore(STORE_NAME).delete(id);

            await completion;
        } finally {
            database.close();
        }
    }

    async function migrateLegacyEvents() {

        const legacyData = localStorage.getItem("sync_events");

        if (!legacyData) return;

        let oldEvents;

        try {
            oldEvents = JSON.parse(legacyData);
        } catch (error) {
            throw new Error("Os dados antigos da Agenda estão inválidos.");
        }

        if (!Array.isArray(oldEvents)) {
            throw new Error("Formato dos compromissos antigos inválido.");
        }

        const database = await openDatabase();

        try {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            const completion = transactionComplete(transaction);
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            const existingEvents = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const existingIds = new Set(
                existingEvents.map(event => event.id)
            );

            oldEvents.forEach(event => {
                if (event.id && !existingIds.has(event.id)) {
                    store.put(event);
                }
            });

            await completion;

            // Só remove os dados antigos após a migração bem-sucedida.
            localStorage.removeItem("sync_events");

            console.log("Migração da Agenda concluída!");

        } finally {
            database.close();
        }
    }

    return {
        getEvents,
        saveEvent,
        deleteEvent,
        migrateLegacyEvents
    };

})();

window.SyncStorage = SyncStorage;
