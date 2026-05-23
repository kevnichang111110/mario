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

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
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
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        const worldManifold = contact.getWorldManifold();
        const normal = worldManifold.normal;

        // 地板 / 牆壁
        if (otherCollider.tag === 0 || otherCollider.tag === 2) {
            if (normal.y < -0.5) {
                this._isJumping = false;
            }
            return;
        }

        // 敵人
        if (otherCollider.tag === 3) {
            // 不讓玩家和敵人互相卡住
            contact.disabled = true;

            if (this.isInvincible) {
                return;
            }

            // 踩頭判定
            if (normal.y < -0.5 || this.node.y > otherCollider.node.y + 20) {
                cc.log("踩到敵人！");

                const enemy = otherCollider.node.getComponent("EnemyController");
                if (enemy) enemy.die();

                if (this._rb) {
                    const v = this._rb.linearVelocity;
                    v.y = 400;
                    this._rb.linearVelocity = v;
                }

                if (this.gameManagerNode) {
                    this.gameManagerNode.getComponent("GameManager").addScore(200);
                }
            } else {
                // 側面受傷
                this.playerGetHit();
            }
            return;
        }

        // 問號塊
        if (otherCollider.tag === 1 && normal.y > 0.5) {
            this.hitQuestionBlock(otherCollider.node);
        }
    }

    playerGetHit() {
        if (this.isInvincible) return;

        cc.log("受傷扣血！");
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

        if (this.node.y < -600) {
            if (this.gameManagerNode) {
                this.gameManagerNode.getComponent("GameManager").playerHit();
            }
            return;
        }

        if (this._anim) {
            const state = this._anim.getAnimationState('walk');

            if (this._walkDir !== 0) {
                if (state && !state.isPlaying) this._anim.play('walk');
            } else {
                if (state && state.isPlaying) this._anim.stop('walk');
            }
        }
    }

    hitQuestionBlock(blockNode: cc.Node) {
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
}