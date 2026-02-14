import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, push, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, push, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
});

// Actions
incrementBtn?.addEventListener('click', () => {
    runTransaction(counterRef, (c) => (c || 0) + 1).then(() => {
        push(historyRef, { type: 'inc', timestamp: serverTimestamp() });
        if (navigator.vibrate) navigator.vibrate(50);
    });
});

decrementBtn?.addEventListener('click', () => {
    if (count > 0) {
        runTransaction(counterRef, (c) => (c > 0 ? c - 1 : 0)).then(() => {
            push(historyRef, { type: 'dec', timestamp: serverTimestamp() });
        });
    }
});

resetBtn?.addEventListener('click', () => {
    if (confirm('Reset global bullshit level to zero?')) {
        set(counterRef, 0);
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

// PWA Install & SW
let deferredPrompt;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

if (installBtnHero && !isStandalone) {
    installBtnHero.style.display = 'inline-flex';
    if (isIOS) {
        installBtnHero.innerHTML = '📥 Install (iOS)';
        installBtnHero.onclick = () => alert(
            "📱 INSTALLAZIONE IPHONE:\n\n" +
            "1️⃣ Premi i 3 puntini (...) o Share\n" +
            "2️⃣ Scegli 'Condividi'\n" +
            "3️⃣ Scegli 'Altro (...)'\n" +
            "4️⃣ Seleziona 'Aggiungi alla schermata Home'\n" +
            "5️⃣ Conferma con 'Aggiungi'"
        );
    } else {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtnHero.innerHTML = '📥 Install App';
        });
        installBtnHero.onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') installBtnHero.style.display = 'none';
                deferredPrompt = null;
            } else {
                alert(
                    "🤖 INSTALLAZIONE ANDROID:\n\n" +
                    "✨ Vuoi l'app sul tuo telefono?\n\n" +
                    "1️⃣ Premi i tre puntini in alto a destra ( ⋮ )\n" +
                    "2️⃣ Scegli 'Aggiungi a schermata Home' 🏠\n" +
                    "3️⃣ Conferma premendo 'Aggiungi' ✅\n\n" +
                    "Facile, no? 🚀"
                );
            }
        };
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js', { scope: './' });
    });
}

console.log("App loaded: v5.2.0 (Clean)");
