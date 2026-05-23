const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) statusLabel: cc.Label = null; 

    @property(cc.Node) playerNode: cc.Node = null;
    @property
    fallBoundary: number = -350;

    private score: number = 0;
    private lives: number = 3;
    private isInvincible: boolean = false;
    private isGameOver: boolean = false; 
    private respawnPos: cc.Vec2 = cc.v2(0, 0);

    onLoad() {
        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -1000);
        cc.director.getCollisionManager().enabled = true;

        if (this.playerNode) {
            this.respawnPos = cc.v2(this.playerNode.x, this.playerNode.y);
        }

        if (this.statusLabel) this.statusLabel.node.active = false;
    }

    start() {
        this.updateUI();
    }

    // 新增：讓 PlayerController 可以檢查遊戲是否結束
    public getIsGameOver() {
        return this.isGameOver;
    }

    update(dt) {
        if (this.isInvincible || this.isGameOver) return;
        if (this.playerNode && this.playerNode.y < this.fallBoundary) {
            this.playerHit();
        }
    }

    public levelWin() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        cc.log("Level Clear!");
        cc.audioEngine.stopMusic();

        if (this.statusLabel) {
            this.statusLabel.string = "GAME WIN";
            this.statusLabel.node.active = true;
        }

        this.freezePlayer();

        // 統一在這裡處理通關後的場景切換
        this.scheduleOnce(() => {
            cc.director.loadScene("Menu"); 
        }, 3.0);
    }

    public playerHit() {
        if (this.isInvincible || this.isGameOver) return;

        this.isInvincible = true;
        this.lives--;
        this.updateUI();

        if (this.lives <= 0) {
            this.executeGameOver();
            return;
        }

        const pc = this.playerNode ? this.playerNode.getComponent("PlayerController") : null;
        if (pc) pc.respawn();

        this.scheduleOnce(() => {
            this.isInvincible = false;
        }, 1.0);
    }

    private freezePlayer() {
        if (!this.playerNode) return;
        const rb = this.playerNode.getComponent(cc.RigidBody);
        if (rb) rb.linearVelocity = cc.v2(0, 0);
        
        const pc = this.playerNode.getComponent("PlayerController");
        if (pc) pc.enabled = false;
    }

    public addScore(points: number) {
        this.score += points;
        this.updateUI();
    }

    private updateUI() {
        if (this.lifeLabel) this.lifeLabel.string = "Life: " + this.lives;
        if (this.scoreLabel) this.scoreLabel.string = "Score: " + this.score;
    }

    private safeRespawnPlayer() {
        this.scheduleOnce(() => {
            if (this.playerNode) {
                this.playerNode.setPosition(this.respawnPos);
                const rb = this.playerNode.getComponent(cc.RigidBody);
                if (rb) rb.linearVelocity = cc.v2(0, 0);
            }
        }, 0);
    }
    // GameManager.ts

    private executeGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        cc.log("執行 Game Over 邏輯");
        cc.audioEngine.stopMusic(); // 停止背景音樂

        // 1. 顯示 GAME OVER 字樣
        if (this.statusLabel) {
            this.statusLabel.string = "GAME OVER";
            this.statusLabel.node.active = true;
        }

        // 2. 讓玩家執行「死亡動畫與物理屏蔽」
        const pc = this.playerNode.getComponent("PlayerController");
        if (pc) {
            pc.playDieAnimation(); // 呼叫玩家死亡方法
        }

        // 3. 播放遊戲結束音效 (確保你在編輯器有拉進去)
        // 建議在 PlayerController 或 GameManager 裡播放
        // 這裡示範在 GameManager 播放，假設你有屬性 gameOverSound
        // cc.audioEngine.playEffect(this.gameOverSound, false);

        // 4. 3秒後切換
        this.scheduleOnce(() => {
            cc.director.loadScene("Menu");
        }, 3.0);
    }
}