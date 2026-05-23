const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property
    moveSpeed: number = 300; 

    @property
    jumpForce: number = 800; 

    private _rb: cc.RigidBody = null;
    private _walkDir: number = 0; 
    private _isJumping: boolean = false;
    private _anim: cc.Animation = null; // 預存動畫組件

    onLoad() {
        this._rb = this.getComponent(cc.RigidBody);
        this._anim = this.getComponent(cc.Animation); // onLoad 就拿好

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    // 良好的習慣：銷毀時移除監聽
    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event) {
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this._walkDir = -1;
                // 用 Math.abs 翻轉，避免變扁
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
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this._walkDir = 0;
                break;
        }
    }

    jump() {
        if (this._isJumping) return; 
        
        // 取得當前速度，只改變 Y 軸
        let v = this._rb.linearVelocity;
        v.y = this.jumpForce;
        this._rb.linearVelocity = v;
        this._isJumping = true;
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        // 落地檢測
        this._isJumping = false;
    }

    update(dt) {
        let velocity = this._rb.linearVelocity;
        velocity.x = this._walkDir * this.moveSpeed;
        this._rb.linearVelocity = velocity;

        // --- 動畫優化控制 ---
        if (this._anim) {
            let state = this._anim.getAnimationState('walk');
            
            if (this._walkDir !== 0) {
                // 如果在走路且沒在播 walk，才 play
                if (state && !state.isPlaying) {
                    this._anim.play('walk');
                }
            } else {
                // 如果停下來了
                if (state && state.isPlaying) {
                    this._anim.stop('walk');
                    // 這裡可以手動把圖片換回第 0 號圖(站立圖)，避免卡在抬腿動作
                }
            }
        }
    }
}