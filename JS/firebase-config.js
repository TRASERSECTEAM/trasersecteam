
const firebaseConfig = {
    apiKey: "AIzaSyBVMpOCjY9gdd4UkSa",
    authDomain: "yanofc-1ecd3.firebaseapp.com",
    databaseURL: "https://yanofc-1ecd3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "yanofc-1ecd3",
    storageBucket: "yanofc-1ecd3.appspot.com",
    messagingSenderId: "843043156565",
    appId: "1:843043156565:web:e00942a837d30e4b4a9adc"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
window.database = database;
window.storage = storage;
