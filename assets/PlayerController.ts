const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property
    moveSpeed: number = 200;

    @property
    jumpForce: number = 500;

    @property(cc.Node)
    gameManagerNode: cc.Node = null;

    @property(cc.SpriteFrame)
    emptyBlockSprite: cc.SpriteFrame = null;

    // --- 音效屬性 (Audio Clips) ---
    @property({ type: cc.AudioClip })
    bgm: cc.AudioClip = null; // 背景音樂

    @property({ type: cc.AudioClip })
    jumpSound: cc.AudioClip = null; // 跳躍音效

    @property({ type: cc.AudioClip })
    hitBlockSound: cc.AudioClip = null; // 撞擊磚塊音效

    @property({ type: cc.AudioClip })
    stompSound: cc.AudioClip = null; // 踩怪音效

    @property({ type: cc.AudioClip })
    hurtSound: cc.AudioClip = null; // 受傷/掉落音效

    @property({ type: cc.AudioClip })
    levelClearSound: cc.AudioClip = null; 

    private _rb: cc.RigidBody = null;
    private _walkDir: number = 0;
    private _isJumping: boolean = false;
    private _anim: cc.Animation = null;
    private _initialPos: cc.Vec2 = null;

    public isInvincible: boolean = false;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;

        this._rb = this.getComponent(cc.RigidBody);
        this._anim = this.getComponent(cc.Animation);
        this._initialPos = cc.v2(this.node.x, this.node.y);

        // --- 播放背景音樂 ---
        if (this.bgm) {
            // playMusic 會自動循環播放且不會被 playEffect 影響
            cc.audioEngine.playMusic(this.bgm, true);
        }

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        // 離開場景時停止音樂
        cc.audioEngine.stopMusic();
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event) {
        switch (event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this._walkDir = -1;
                this.node.scaleX = -Math.abs(this.node.scaleX);
                break;

            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this._walkDir = 1;
                this.node.scaleX = Math.abs(this.node.scaleX);
                break;

            case cc.macro.KEY.w:
            case cc.macro.KEY.space:
                this.jump();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this._walkDir = 0;
                break;
        }
    }

    jump() {
        if (this._isJumping || !this._rb) return;

        const v = this._rb.linearVelocity;
        v.y = this.jumpForce;
        this._rb.linearVelocity = v;
        this._isJumping = true;

        // --- 播放跳躍音效 ---
        if (this.jumpSound) cc.audioEngine.playEffect(this.jumpSound, false);

        // --- 播放跳躍動畫 ---
        if (this._anim) this._anim.play('jump');
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        let gm = this.gameManagerNode.getComponent("GameManager");
        if (gm.getIsGameOver()) {
            contact.disabled = true;
            return;
        }
        const worldManifold = contact.getWorldManifold();
        const normal = worldManifold.normal;

        // 地板 / 牆壁
        if (otherCollider.tag === 0 || otherCollider.tag === 2) {
            if (normal.y < -0.5) this._isJumping = false;
            return;
        }

        // 敵人 (Tag 3)
        if (otherCollider.tag === 3) {
            contact.disabled = true;
            if (this.isInvincible) return;
            if (normal.y < -0.5 || this.node.y > otherCollider.node.y + 20) {
                const enemy = otherCollider.node.getComponent("EnemyController");
                if (enemy) enemy.die();
                if (this.stompSound) cc.audioEngine.playEffect(this.stompSound, false);
                if (this._rb) this._rb.linearVelocity = cc.v2(this._rb.linearVelocity.x, 400);
                if (this.gameManagerNode) this.gameManagerNode.getComponent("GameManager").addScore(200);
            } else {
                this.playerGetHit();
            }
            return;
        }

        // 問號塊 (Tag 1)
        if (otherCollider.tag === 1 && normal.y > 0.5) {
            this.hitQuestionBlock(otherCollider.node);
        }

        // 旗子 (Tag 4)
        if (otherCollider.tag === 4) {
            cc.log("觸發旗子碰撞");
            this.reachGoal();
            return;
        }
    }

    reachGoal() {
        let gm = this.gameManagerNode.getComponent("GameManager");
        // 如果已經通關就跳過，避免重複執行
        if (gm.getIsGameOver()) return; 

        // 1. 通知 GameManager 處理 UI 與通關狀態
        gm.levelWin(); 
        
        // 2. 停止 BGM 並播放勝利音效
        cc.audioEngine.stopMusic(); 
        if (this.levelClearSound) {
            cc.log("播放勝利音效");
            cc.audioEngine.playEffect(this.levelClearSound, false);
        }
        
        // 3. 停止物理移動
        this._walkDir = 0;
        this._rb.linearVelocity = cc.v2(0, 0);
        
        // 4. 強制切換回 idle 動畫並禁用腳本防止操作
        if (this._anim) {
            this._anim.stop();
            this._anim.play('idle');
        }
        this.enabled = false; 
    }

    playerGetHit() {
        if (this.isInvincible) return;

        cc.log("受傷扣血！");
        
        // --- 播放受傷音效 ---
        if (this.hurtSound) cc.audioEngine.playEffect(this.hurtSound, false);

        if (this.gameManagerNode) {
            this.gameManagerNode.getComponent("GameManager").playerHit();
        }
    }

    startInvincibility() {
        this.isInvincible = true;
        cc.Tween.stopAllByTarget(this.node);

        cc.tween(this.node)
            .repeat(10,
                cc.tween()
                    .to(0.1, { opacity: 0 })
                    .to(0.1, { opacity: 255 })
            )
            .start();

        this.unschedule(this.resetInvincible);
        this.scheduleOnce(this.resetInvincible, 2);
    }

    resetInvincible() {
        this.isInvincible = false;
        this.node.opacity = 255;
        cc.log("無敵結束");
    }

    respawn() {
        cc.log("執行重生邏輯...");

        this.scheduleOnce(() => {
            if (!this._rb) return;

            this._rb.linearVelocity = cc.v2(0, 0);
            this._rb.angularVelocity = 0;

            this.node.setPosition(this._initialPos);
            this._isJumping = false;
            this._walkDir = 0;

            this.startInvincibility();

            cc.log("重生完成，位置已重置");
        }, 0);
    }


    update(dt) {
        if (!this._rb) return;

        const velocity = this._rb.linearVelocity;
        velocity.x = this._walkDir * this.moveSpeed;
        this._rb.linearVelocity = velocity;

        // 掉落地圖判定
        if (this.node.y < -350) {
            // --- 播放掉落/死亡音效 ---
            if (this.hurtSound) cc.audioEngine.playEffect(this.hurtSound, false);
            
            if (this.gameManagerNode) {
                this.gameManagerNode.getComponent("GameManager").playerHit();
            }
            return;
        }

        // --- 動畫狀態機控制 ---
        if (this._anim) {
            if (this._isJumping) {
                // 跳躍動畫由 jump() 觸發，這裡通常不需要重複呼叫 play
            } else if (this._walkDir !== 0) {
                // 走路中且沒在播放 walk
                if (!this._anim.getAnimationState('walk').isPlaying) {
                    this._anim.play('walk');
                }
            } else {
                // 靜止狀態且沒在播放 idle
                if (!this._anim.getAnimationState('idle').isPlaying) {
                    this._anim.play('idle');
                }
            }
        }
    }

    hitQuestionBlock(blockNode: cc.Node) {
        // --- 播放撞擊磚塊音效 ---
        if (this.hitBlockSound) cc.audioEngine.playEffect(this.hitBlockSound, false);

        const anim = blockNode.getComponent(cc.Animation);
        if (anim) anim.stop();

        if (this.gameManagerNode) {
            this.gameManagerNode.getComponent("GameManager").addScore(100);
        }

        cc.tween(blockNode)
            .by(0.1, { y: 10 })
            .by(0.1, { y: -10 })
            .start();

        const sprite = blockNode.getComponent(cc.Sprite);
        if (sprite && this.emptyBlockSprite) {
            sprite.spriteFrame = this.emptyBlockSprite;
        }

        const collider = blockNode.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.tag = 0;
    }

    public playDieAnimation() {
        cc.log("播放死亡表現");
        
        // 1. 禁用控制
        this.enabled = false; 

        // 2. 播放動畫
        if (this._anim) {
            this._anim.stop();
            this._anim.play('die'); // 確保你的動畫剪輯叫 'die'
        }

        // 3. 播放死亡音效 (GameManager 或這裡播都可以)
        // if (this.dieSound) cc.audioEngine.playEffect(this.dieSound, false);

        // 4. 物理屏蔽：讓馬力歐不再被撞到
        // 把所有碰撞器設為 Sensor，這樣他會穿透地板和敵人掉出螢幕
        let colliders = this.getComponents(cc.PhysicsCollider);
        colliders.forEach(c => c.sensor = true);

        // 5. 死亡小跳躍：經典馬力歐死法
        if (this._rb) {
            this._rb.linearVelocity = cc.v2(0, 500);
        }
    }
}