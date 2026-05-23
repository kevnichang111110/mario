const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    lifeLabel: cc.Label = null;

    @property(cc.Node)
    playerNode: cc.Node = null;

    @property
    fallBoundary: number = -350;

    private score: number = 0;
    private lives: number = 3;
    private isInvincible: boolean = false;
    private respawnPos: cc.Vec2 = cc.v2(0, 0);

    onLoad() {
        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -1000);

        cc.director.getCollisionManager().enabled = true;

        if (this.playerNode) {
            this.respawnPos = cc.v2(this.playerNode.x, this.playerNode.y);
        }
    }

    start() {
        this.updateUI();
    }

    update(dt) {
        if (this.isInvincible) return;

        if (this.playerNode && this.playerNode.y < this.fallBoundary) {
            this.playerHit();
        }
    }

    public playerHit() {
        if (this.isInvincible) return;

        this.isInvincible = true;

        this.lives--;
        this.updateUI();
        cc.log("玩家受傷，剩餘生命: " + this.lives);

        if (this.lives <= 0) {
            cc.log("Game Over!");
            this.scheduleOnce(() => {
                cc.director.loadScene("Menu");
            }, 0);
            return;
        }

        const pc = this.playerNode ? this.playerNode.getComponent("PlayerController") : null;
        if (pc) {
            pc.respawn();
        } else {
            this.safeRespawnPlayer();
        }

        this.scheduleOnce(() => {
            this.isInvincible = false;
            cc.log("無敵時間結束");
        }, 1.0);
    }

    public addScore(points: number) {
        this.score += points;
        this.updateUI();
    }

    private updateUI() {
        if (this.scoreLabel) this.scoreLabel.string = "Life: " + this.lives;
        if (this.lifeLabel) this.lifeLabel.string = "Score: " + this.score;
    }

    private safeRespawnPlayer() {
        if (!this.playerNode) return;

        this.scheduleOnce(() => {
            this.playerNode.setPosition(this.respawnPos);

            const rb = this.playerNode.getComponent(cc.RigidBody);
            if (rb) {
                rb.linearVelocity = cc.v2(0, 0);
                rb.angularVelocity = 0;
            }
        }, 0);
    }
}