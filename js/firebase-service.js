// ================================================
// FIREBASE-SERVICE.JS — Firestore compat SDK, sin ES modules
// Requiere firebase-app-compat.js y firebase-firestore-compat.js en index.html
// ================================================

function initFirebase() {
  if (isFirebaseUnconfigured()) {
    console.warn('[Firebase] Credenciales sin configurar. Firestore desactivado.');
    return false;
  }
  try {
    if (!window._fb) {
      firebase.initializeApp(firebaseConfig);
      window._fb = { db: firebase.firestore() };
    }
    return true;
  } catch (err) {
    console.error('[Firebase] No se pudo inicializar (¿SDK bloqueado o sin red?):', err);
    showError('No se pudo conectar con Firebase. Revisa tu conexión.');
    return false;
  }
}

function getDB() {
  if (!window._fb || !window._fb.db) throw new Error('Firebase no inicializado.');
  return window._fb.db;
}

function listenCollection(collectionName, onData, onError) {
  return getDB().collection(collectionName).onSnapshot(
    function (snap) {
      const rows = [];
      snap.forEach(function (d) { rows.push(Object.assign({ id: d.id }, d.data())); });
      onData(rows);
    },
    function (err) { if (onError) onError(err); }
  );
}

function addDocument(collectionName, data) {
  return getDB().collection(collectionName).add(Object.assign({}, data, {
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  })).then(function (ref) { return ref.id; });
}

// Upsert con ID propio (p. ej. `${technicianId}_${weekendDate}`).
function setDocument(collectionName, id, data) {
  return getDB().collection(collectionName).doc(id).set(Object.assign({}, data, {
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }), { merge: true });
}

function updateDocument(collectionName, id, patch) {
  return getDB().collection(collectionName).doc(id).update(Object.assign({}, patch, {
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }));
}

function deleteDocument(collectionName, id) {
  return getDB().collection(collectionName).doc(id).delete();
}
