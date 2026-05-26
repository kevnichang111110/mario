import FirebaseManager from "./FirebaseManager";
const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuManager extends cc.Component {

    @property(cc.Label)
    statusLabel: cc.Label = null!; // 加上 ! 號解決第 8 行紅線

    start() {
        this.updateStatus();
    }

    updateStatus() {
        if (!this.statusLabel) return;

        let user = FirebaseManager.instance.currentUser;

        // 使用 if 確保 user 存在且 email 存在
        if (user && user.email) {
            // 取得 Email 的前半段作為名稱 (例如 t@gmail.com -> T)
            let name = user.email.split('@')[0].toUpperCase();
            this.statusLabel.string = "PLAYER: " + name;
        } else {
            // 未登入顯示
            this.statusLabel.string = "NOT LOGGED IN";
        }
    }

    // --- 以下為場景切換按鈕方法 ---

    // 進入遊戲場景 (Level 1)
    public toGameScene() {
        cc.director.loadScene("game"); 
    }

    // 進入關卡選擇
    public toLevelSelect() {
        cc.director.loadScene("LevelSelect");
    }

    // 進入遊戲場景 2
    public toGameScene2() {
        cc.director.loadScene("game2"); 
    }

    // 進入登入畫面
    public goToLogin() {
        cc.director.loadScene("Login");
    }

    // 進入排行榜
    public goToLeaderboard() {
        cc.director.loadScene("Leaderboard"); 
    }

    // 回到主選單
    public toMenu() {
        cc.director.loadScene("Menu");
    }
}