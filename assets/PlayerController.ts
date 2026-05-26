const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property(cc.Prefab) mushroomPrefab: cc.Prefab = null; 
    @property({ type: cc.AudioClip }) powerUpSound: cc.AudioClip = null; 
    @property({ type: cc.AudioClip }) shrinkSound: cc.AudioClip = null; // 新增：變小音效屬性

    private isBig: boolean = false; 
    @property moveSpeed: number = 200;
    @property jumpForce: number = 500;
    @property(cc.Node) gameManagerNode: cc.Node = null;
    @property(cc.SpriteFrame) emptyBlockSprite: cc.SpriteFrame = null;

    // --- 音效屬性 ---
    @property({ type: cc.AudioClip }) bgm: cc.AudioClip = null; 
    @property({ type: cc.AudioClip }) jumpSound: cc.AudioClip = null; 
    @property({ type: cc.AudioClip }) hitBlockSound: cc.AudioClip = null; 
    @property({ type: cc.AudioClip }) stompSound: cc.AudioClip = null; 
    @property({ type: cc.AudioClip }) hurtSound: cc.AudioClip = null; 
    @property({ type: cc.AudioClip }) levelClearSound: cc.AudioClip = null; 

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

        if (this.bgm) {
            cc.audioEngine.playMusic(this.bgm, true);
        }

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.audioEngine.stopMusic();
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event) {
        let gm = this.gameManagerNode.getComponent("GameManager");
        if (gm.getIsGameOver() || !this.enabled) return;

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
        let gm = this.gameManagerNode.getComponent("GameManager");
        if (this._isJumping || !this._rb || gm.getIsGameOver()) return;

        const v = this._rb.linearVelocity;
        v.y = this.jumpForce;
        this._rb.linearVelocity = v;
        this._isJumping = true;

        if (this.jumpSound) cc.audioEngine.playEffect(this.jumpSound, false);
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

        if (otherCollider.tag === 0 || otherCollider.tag === 2) {
            if (normal.y < -0.5) this._isJumping = false;
            return;
        }

        if (otherCollider.tag === 3) {
            contact.disabled = true; 
            if (this.isInvincible) return;
            if (normal.y < -0.5 || this.node.y > otherCollider.node.y + 20) {
                const enemy = otherCollider.node.getComponent("EnemyController");
                if (enemy) enemy.die();
                if (this.stompSound) cc.audioEngine.playEffect(this.stompSound, false);
                this._rb.linearVelocity = cc.v2(this._rb.linearVelocity.x, 400);
                if (this.gameManagerNode) gm.addScore(200);
            } else {
                this.playerGetHit();
            }
            return;
        }

        if (otherCollider.tag === 1 && normal.y > 0.5) {
            this.hitQuestionBlock(otherCollider.node);
        }

        if (otherCollider.tag === 4) {
            contact.disabled = true;
            this.reachGoal();
            return;
        }

        if (otherCollider.tag === 5) {
            this.getPowerUp(otherCollider.node);
            return;
        }
    }

    getPowerUp(itemNode: cc.Node) {
        if (this.isBig) {
            itemNode.destroy();
            return;
        }
        cc.log("吃到蘑菇，變大！");
        this.isBig = true;
        itemNode.destroy();
        if (this.powerUpSound) cc.audioEngine.playEffect(this.powerUpSound, false);
        cc.tween(this.node)
            .to(0.1, { scale: 1.5 })
            .to(0.1, { scale: 1.0 })
            .to(0.1, { scale: 1.5 }) 
            .start();
    }

    playerGetHit() {
        if (this.isInvincible) return;

        // --- 修正變小邏輯與音效 ---
        if (this.isBig) {
            cc.log("大馬力歐受傷，播放變小音效並縮小");
            this.isBig = false;
            
            // 播放變小音效
            if (this.shrinkSound) {
                cc.audioEngine.playEffect(this.shrinkSound, false);
            }

            this.startInvincibility();
            cc.tween(this.node).to(0.2, { scale: 1.0 }).start();
            return; 
        }

        cc.log("小馬力歐受傷扣血！");
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
            .call(() => {
                this.isInvincible = false;
                this.node.opacity = 255;
            })
            .start();
        this.unschedule(this.resetInvincible);
        this.scheduleOnce(this.resetInvincible, 2);
    }

    resetInvincible() {
        this.isInvincible = false;
        this.node.opacity = 255;
    }

    reachGoal() {
        let gm = this.gameManagerNode.getComponent("GameManager");
        if (gm.getIsGameOver()) return; 

        gm.levelWin(); 
        
        cc.audioEngine.stopMusic(); 
        if (this.levelClearSound) {
            cc.audioEngine.playEffect(this.levelClearSound, false);
        }
        
        // 1. 立即停止移動指令
        this._walkDir = 0;
        this.enabled = false; // 禁用腳本邏輯 (停止 update 中的速度賦值)

        // 2. 立即將速度歸零並關閉重力 (防止這一幀掉下去)
        if (this._rb) {
            this._rb.linearVelocity = cc.v2(0, 0);
            this._rb.gravityScale = 0; 
        }

        // 3. 【關鍵修正】延遲到下一幀將剛體設為 Static
        // 這樣可以避開物理引擎的計算鎖定，確保馬力歐被「釘」在原地
        this.scheduleOnce(() => {
            if (this._rb) {
                this._rb.linearVelocity = cc.v2(0, 0);
                this._rb.type = cc.RigidBodyType.Static; 
            }
        }, 0);
        
        // 4. 強制切換回 idle
        if (this._anim) {
            this._anim.stop();
            this._anim.play('idle');
        }
    }

    update(dt) {
        if (!this._rb || !this.enabled) return;
        const velocity = this._rb.linearVelocity;
        velocity.x = this._walkDir * this.moveSpeed;
        this._rb.linearVelocity = velocity;

        if (this.node.y < -350) {
            if (this.gameManagerNode) {
                this.gameManagerNode.getComponent("GameManager").playerHit();
            }
            return;
        }

        if (this._anim) {
            if (this._isJumping) {
            } else if (this._walkDir !== 0) {
                if (!this._anim.getAnimationState('walk').isPlaying) this._anim.play('walk');
            } else {
                if (!this._anim.getAnimationState('idle').isPlaying) this._anim.play('idle');
            }
        }
    }

    hitQuestionBlock(blockNode: cc.Node) {
        if (this.hitBlockSound) cc.audioEngine.playEffect(this.hitBlockSound, false);
        const anim = blockNode.getComponent(cc.Animation);
        if (anim) anim.stop();
        if (this.gameManagerNode) {
            this.gameManagerNode.getComponent("GameManager").addScore(100);
        }
        cc.tween(blockNode).by(0.1, { y: 10 }).by(0.1, { y: -10 }).start();
        const sprite = blockNode.getComponent(cc.Sprite);
        if (sprite && this.emptyBlockSprite) sprite.spriteFrame = this.emptyBlockSprite;
        blockNode.getComponent(cc.PhysicsBoxCollider).tag = 0;

        if (this.mushroomPrefab) {
            let mushroom = cc.instantiate(this.mushroomPrefab);
            mushroom.parent = blockNode.parent; 
            mushroom.setPosition(blockNode.x, blockNode.y + 50); 
        }
    }

    public playDieAnimation() {
        this.enabled = false; 
        if (this._anim) {
            this._anim.stop();
            this._anim.play('die');
        }
        let colliders = this.getComponents(cc.PhysicsCollider);
        colliders.forEach(c => c.sensor = true);
        if (this._rb) {
            this._rb.linearVelocity = cc.v2(0, 500);
        }
    }

    // --- 修正重生邏輯：強制縮小 ---
    respawn() {
        this.scheduleOnce(() => {
            if (!this._rb) return;
            
            // 重置位置與速度
            this._rb.linearVelocity = cc.v2(0, 0);
            this.node.setPosition(this._initialPos);
            
            // 重置狀態
            this._isJumping = false;
            this._walkDir = 0;
            
            // 重要：掉下去或死亡重生後，強制變回小馬力歐
            this.isBig = false;
            this.node.scale = 1.0; 
            
            this.startInvincibility();
            cc.log("重生完成：位置重置且已變回小馬力歐");
        }, 0);
    }
}