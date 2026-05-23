const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) statusLabel: cc.Label = null; 
    @property(cc.Label) timerLabel: cc.Label = null; 

    @property(cc.Node) playerNode: cc.Node = null;
    @property fallBoundary: number = -350;

    // --- 新增音效屬性 ---
    @property(cc.AudioClip) gameOverSound: cc.AudioClip = null; 

    private timeLeft: number = 300; 
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
        
        this.startTimer();
    }

    start() {
        this.updateUI();
    }

    private startTimer() {
        this.schedule(this.updateTimer, 1);
    }

    private updateTimer() {
        if (this.isGameOver) return;
        this.timeLeft--;
        this.updateUI();
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.executeGameOver(); 
        }
    }

    private updateUI() {
        if (this.lifeLabel) this.lifeLabel.string = "LIFE " + this.lives;
        if (this.scoreLabel) this.scoreLabel.string = "SCORE " + this.score;
        if (this.timerLabel) this.timerLabel.string = "TIME " + this.timeLeft;
    }

    public levelWin() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.unschedule(this.updateTimer);
        cc.audioEngine.stopMusic();

        this.score += (this.lives * this.timeLeft); 
        this.saveScoreToLeaderboard(this.score); 
        this.updateUI();

        if (this.statusLabel) {
            this.statusLabel.string = "GAME WIN\nSCORE " + this.score;
            this.statusLabel.node.active = true;
        }
        this.freezePlayer();
        this.scheduleOnce(() => { cc.director.loadScene("Menu"); }, 3.0);
    }

    public playerHit() {
        if (this.isInvincible || this.isGameOver) return;

        this.isInvincible = true;
        this.lives--;
        this.updateUI();

        // 💡 如果掉下懸崖，手動叫 PlayerController 播放受傷音效
        const pc = this.playerNode ? this.playerNode.getComponent("PlayerController") : null;
        if (pc && pc.hurtSound) {
            cc.audioEngine.playEffect(pc.hurtSound, false);
        }

        if (this.lives <= 0) {
            this.executeGameOver();
            return;
        }

        if (pc) {
            pc.respawn();
        } else {
            this.safeRespawnPlayer();
        }

        this.scheduleOnce(() => { this.isInvincible = false; }, 1.0);
    }

    private executeGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        cc.log("GAME OVER!");
        this.unschedule(this.updateTimer);
        
        // 1. 停止主背景音樂
        cc.audioEngine.stopMusic(); 

        // 2. 播放 Game Over 專屬音效
        if (this.gameOverSound) {
            cc.audioEngine.playEffect(this.gameOverSound, false);
        }

        if (this.statusLabel) {
            this.statusLabel.string = "GAME OVER";
            this.statusLabel.node.active = true;
        }

        const pc = this.playerNode ? this.playerNode.getComponent("PlayerController") : null;
        if (pc) {
            pc.playDieAnimation(); 
        }

        this.scheduleOnce(() => { cc.director.loadScene("Menu"); }, 3.0);
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

    public getIsGameOver() { return this.isGameOver; }

    private safeRespawnPlayer() {
        this.scheduleOnce(() => {
            if (this.playerNode) {
                this.playerNode.setPosition(this.respawnPos);
                const rb = this.playerNode.getComponent(cc.RigidBody);
                if (rb) rb.linearVelocity = cc.v2(0, 0);
            }
        }, 0);
    }

    private saveScoreToLeaderboard(newScore: number) {
        let data = cc.sys.localStorage.getItem('mario_leaderboard');
        let list = data ? JSON.parse(data) : [];
        list.push(newScore);
        list.sort((a, b) => b - a);
        if (list.length > 5) list = list.slice(0, 5);
        cc.sys.localStorage.setItem('mario_leaderboard', JSON.stringify(list));
    }

    update(dt) {
        if (this.isInvincible || this.isGameOver) return;
        if (this.playerNode && this.playerNode.y < this.fallBoundary) {
            this.playerHit();
        }
    }
}