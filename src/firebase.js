
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB-kq15afXMDNP3iiAk2bJnbDOXFV9O62o",
  authDomain: "logstar2-8b464.firebaseapp.com",
  projectId: "logstar2-8b464",
  storageBucket: "logstar2-8b464.firebasestorage.app",
  messagingSenderId: "782366766624",
  appId: "1:782366766624:web:34bc6d2e5de89c7169ae45"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
