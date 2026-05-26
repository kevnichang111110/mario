// FirebaseManager.ts
const firebaseConfig = {
  apiKey: "AIzaSyDSE9eBrZs9qW_iXgBkBtIbOcKQ6u0UfvI",
  authDomain: "mario-2810b.firebaseapp.com",
  projectId: "mario-2810b",
  storageBucket: "mario-2810b.firebasestorage.app",
  messagingSenderId: "892186399742",
  appId: "1:892186399742:web:e1989acebaff4ee73426af",
  measurementId: "G-1MWG0NXS4Z"
};

// 這裡是假設你已經在 HTML 引入了 Firebase SDK
// 或者你可以使用 npm install firebase (需要配置 Cocos npm)
declare const firebase: any;

export default class FirebaseManager {
    private static _instance: FirebaseManager = null;
    public static get instance() {
        if (!this._instance) this._instance = new FirebaseManager();
        return this._instance;
    }

    private _lastUploadTime: number = 0;
    private db = null;
    public currentUser = null;

    init() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        this.db = firebase.firestore();
    }

    // 登入/註冊
    async login(email, password) {
        try {
            let res = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.currentUser = res.user;
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    async signUp(email, password) {
        try {
            const res = await firebase.auth().createUserWithEmailAndPassword(email, password);
            this.currentUser = res.user;
            return { success: true };
        } catch (error) {
            // Firebase 會在這裡回傳錯誤資訊
            return { 
                success: false, 
                code: error.code, 
                message: error.message 
            };
        }
    }
    // 儲存分數到 Firestore
    async uploadScore(score) {
        let now = Date.now();
        if (now - this._lastUploadTime < 2000) return;
        this._lastUploadTime = now;
        if (!this.currentUser) return;
        await this.db.collection("leaderboard").add({
            username: this.currentUser.email.split('@')[0], // 用 Email 前綴當名字
            score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // 取得線上排行榜
    async getTopScores() {
        let snapshot = await this.db.collection("leaderboard")
            .orderBy("score", "desc")
            .limit(5)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
}