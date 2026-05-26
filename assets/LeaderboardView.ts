const {ccclass, property} = cc._decorator;
import FirebaseManager from "./FirebaseManager";
@ccclass
export default class LeaderboardView extends cc.Component {
    @property(cc.Label) scoreListLabel: cc.Label = null;

    start() {
        let data = cc.sys.localStorage.getItem('mario_leaderboard');
        if (data) {
            let list = JSON.parse(data);
            let str = "";
            list.forEach((s, index) => {
                str += `${index + 1}. ${s}\n`;
            });
            this.scoreListLabel.string = str;
        } else {
            this.scoreListLabel.string = "NO RECORDS";
        }
    }

    backToMenu() {
        cc.director.loadScene("Menu");
    }
    async start() {
        let scores = await FirebaseManager.instance.getTopScores();
        let str = "";
        scores.forEach((data, index) => {
            str += `${index + 1}. ${data.username} - ${data.score}\n`;
        });
        this.scoreListLabel.string = str;
    }
}