const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuManager extends cc.Component {

    // 進入關卡選擇
    public toLevelSelect() {
        cc.director.loadScene("LevelSelect");
    }

    // 進入遊戲場景 (Level 1)
    public toGameScene() {
        cc.director.loadScene("game"); // 確保跟你之前的場景檔名一致
    }

    // 回到主選單
    public toMenu() {
        cc.director.loadScene("Menu");
    }
}