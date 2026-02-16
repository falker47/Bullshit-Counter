import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getDatabase, ref, onValue, set, push, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const counterRef = ref(db, 'counter');
const historyRef = ref(db, 'history');

// State
let count = 0;

// DOM
const counterDisplay = document.getElementById('counter-value');
const incrementBtn = document.getElementById('increment-btn');
const decrementBtn = document.getElementById('decrement-btn');
const resetBtn = document.getElementById('reset-btn');
const historyList = document.getElementById('history-list');
const shareBtn = document.getElementById('share-btn');
const installBtnHero = document.getElementById('install-btn-hero');

// Sync
onValue(counterRef, (snap) => {
    count = snap.val() || 0;
    if (counterDisplay) counterDisplay.textContent = count;
}, (error) => {
    console.error("COUNTER LOAD ERROR:", error);
    if (counterDisplay) counterDisplay.textContent = "ERR";
    alert("Errore caricamento contatore: " + error.message);
});

onValue(historyRef, (snap) => {
    const data = snap.val();
    if (data && historyList) {
        const historyArray = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        historyList.innerHTML = historyArray.slice(0, 20).map(entry => `
            <li class="history-item">
                <span>${entry.type === 'inc' ? '+1 Bullshit' : entry.type === 'dec' ? '-1 Bullshit' : 'Reset'}</span>
                <span>${new Date(entry.timestamp).toLocaleTimeString()}</span>
            </li>
        `).join('');
    }
}, (error) => {
    console.error("HISTORY LOAD ERROR:", error);
});

// Actions
incrementBtn?.addEventListener('click', () => {
    runTransaction(counterRef, (c) => (c || 0) + 1).then(() => {
        push(historyRef, { type: 'inc', timestamp: serverTimestamp() });
        if (navigator.vibrate) navigator.vibrate(50);
    }).catch(err => alert("Errore incremento: " + err.message));
});

decrementBtn?.addEventListener('click', () => {
    if (count > 0) {
        runTransaction(counterRef, (c) => (c > 0 ? c - 1 : 0)).then(() => {
            push(historyRef, { type: 'dec', timestamp: serverTimestamp() });
        }).catch(err => alert("Errore decremento: " + err.message));
    }
});

resetBtn?.addEventListener('click', () => {
    if (confirm('Reset global bullshit level to zero?')) {
        set(counterRef, 0).catch(err => alert("Errore reset: " + err.message));
        set(historyRef, null);
        push(historyRef, { type: 'reset', timestamp: serverTimestamp() });
    }
});

shareBtn?.addEventListener('click', async () => {
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Bullshit Counter', url: window.location.href });
        } catch (e) { }
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied!');
    }
});

// HARD DISABLE SERVICE WORKER
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister().then(function (boolean) {
                console.log('Service Worker unregistered: ', boolean);
            });
        }
    });
}


console.log("App loaded: v5.4.0 (Anti-Cache)");
