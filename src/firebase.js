import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBEtfQ-TQWxecPI49hPBWjzZLH1xoddkGc",
  authDomain: "app-textura1992.firebaseapp.com",
  databaseURL: "https://app-textura1992-default-rtdb.firebaseio.com",
  projectId: "app-textura1992",
  storageBucket: "app-textura1992.firebasestorage.app",
  messagingSenderId: "188848926629",
  appId: "1:188848926629:web:3771e6babb222415a4424c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

export { db, storage };