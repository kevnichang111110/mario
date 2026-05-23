const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    lifeLabel: cc.Label = null;

    @property(cc.Node)
    playerNode: cc.Node = null;

    @property
    fallBoundary: number = 0; // 設定掉到多深算死亡

    private score: number = 0;
    private lives: number = 3;
    private respawnPos: cc.Vec2 = cc.v2(0, 0); // 用來儲存重生位置

    onLoad() {
        // 啟動引擎
        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -1000);

        cc.director.getCollisionManager().enabled = true;

        // --- 新增：紀錄初始位置作為重生點 ---
        if (this.playerNode) {
            this.respawnPos = cc.v2(this.playerNode.x, this.playerNode.y);
        }
    }

    start() {
        this.updateUI();
    }

    update(dt) {
        // --- 新增：每一幀檢查馬力歐是否掉出地圖 ---
        if (this.playerNode && this.playerNode.y < this.fallBoundary) {
            this.playerHit();
        }
    }

    // 提供給其他腳本呼叫的方法 (例如碰到敵人、掉進洞裡)
    public playerHit() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            cc.log("Game Over!");
            // 遊戲結束，重新載入場景
            cc.director.loadScene("game"); 
        } else {
            this.respawnPlayer();
        }
    }

    public addScore(points: number) {
        this.score += points;
        this.updateUI();
    }

    private updateUI() {
        if (this.scoreLabel) this.scoreLabel.string = "Score: " + this.score;
        if (this.lifeLabel) this.lifeLabel.string = "Life: " + this.lives;
    }

    private respawnPlayer() {
        // 1. 將位置移回重生點
        this.playerNode.setPosition(this.respawnPos);

        // 2. 關鍵：重置物理速度 (重要！)
        // 如果不歸零，馬力歐會帶著墜落的速度在起點繼續往下衝
        let rb = this.playerNode.getComponent(cc.RigidBody);
        if (rb) {
            rb.linearVelocity = cc.v2(0, 0); // 速度歸零
            rb.angularVelocity = 0;          // 旋轉速度歸零
        }
    }
}