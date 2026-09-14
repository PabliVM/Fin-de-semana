// ================================================
// FIREBASE-CONFIG.JS — Sustituir placeholders por credenciales reales
// ================================================

const firebaseConfig = {
  apiKey: 'AIzaSyD8zZti58e5vru0XuztfIYVdVilgva7D_A',
  authDomain: 'fin-de-semana-ddfef.firebaseapp.com',
  projectId: 'fin-de-semana-ddfef',
  storageBucket: 'fin-de-semana-ddfef.firebasestorage.app',
  messagingSenderId: '444157256737',
  appId: '1:444157256737:web:030f276dd47ffe1c5fef60',
};

function isFirebaseUnconfigured() {
  return firebaseConfig.apiKey === 'TU_API_KEY';
}
