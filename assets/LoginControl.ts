const {ccclass, property} = cc._decorator;
import FirebaseManager from "./FirebaseManager";

@ccclass
export default class LoginControl extends cc.Component {

    @property(cc.EditBox)
    emailEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    passwordEditBox: cc.EditBox = null;

    onLoad() {
        FirebaseManager.instance.init();
    }
    // 給登入按鈕綁定的點擊事件
    onLoginClick() {
        let email = this.emailEditBox.string;
        let password = this.passwordEditBox.string;

        if (email === "" || password === "") {
            alert("Please enter account and password");
            return;
        }

        cc.log("正在登入:", email);
        
        // 呼叫 FirebaseManager 登入 (假設你之前寫好了)
        FirebaseManager.instance.login(email, password).then(success => {
            if (success) {
                cc.director.loadScene("Menu"); // 登入成功進選單
            } else {
                alert("Login Failed! Please check your account.");
            }
        });
    }
    // LoginControl.ts

    onSignUpClick() {
        let email = this.emailEditBox.string;
        let password = this.passwordEditBox.string;

        if (email === "" || password === "") {
            alert("請輸入 Email 和密碼以進行註冊");
            return;
        }

        cc.log("嘗試註冊帳號:", email);

        FirebaseManager.instance.signUp(email, password).then(result => {
            if (result.success) {
                alert("註冊成功！已自動登入。");
                cc.director.loadScene("Menu");
            } else {
                // --- 這裡就是偵測重複註冊的地方 ---
                if (result.code === "auth/email-already-in-use") {
                    alert("此 Email 已經被註冊過了！請直接登入或更換帳號。");
                } else if (result.code === "auth/weak-password") {
                    alert("密碼太弱了，請至少輸入 6 位數。");
                } else if (result.code === "auth/invalid-email") {
                    alert("Email 格式不正確。");
                } else {
                    alert("註冊失敗: " + result.message);
                }
            }
        });
    }
}