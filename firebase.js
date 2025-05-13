// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js ";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js ";

const firebaseConfig = {
  apiKey: "AIzaSyB0ZniNIObB6s8_5VsOr1jC30o4yUWsEMg",
  authDomain: "jardineriatj-d989a.firebaseapp.com",
  projectId: "jardineriatj-d989a",
  storageBucket: "jardineriatj-d989a.appspot.com",
  messagingSenderId: "299522353080",
  appId: "1:299522353080:web:82c2c7b30055177adb514d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };