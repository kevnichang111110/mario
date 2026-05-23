const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemMushroom extends cc.Component {
    @property
    speed: number = 150;

    private _rb: cc.RigidBody = null;

    onLoad() {
        this._rb = this.getComponent(cc.RigidBody);
        if (this._rb) {
            this._rb.linearVelocity = cc.v2(0, 300);
        }
    }

    update(dt) {
        if (!this._rb) return;
        let v = this._rb.linearVelocity;
        v.x = this.speed;
        this._rb.linearVelocity = v;
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        // 1. 碰到玩家 (Tag 1)：穿透（不產生推擠）
        if (otherCollider.tag === 1) {
            contact.disabled = true;
            return;
        }

        const worldManifold = contact.getWorldManifold();
        const normal = worldManifold.normal;

        // 2. 反彈名單：地板(0), 磚塊(1), 牆壁(2), 敵人(3), 其他蘑菇(5)
        const bounceTags = [0, 1, 2, 3, 5];

        if (bounceTags.includes(otherCollider.tag)) {
            // 偵測水平撞擊
            if (Math.abs(normal.x) > 0.5) {
                this.speed *= -1;
                
                // 立即同步速度，防止重疊卡住
                if (this._rb) {
                    let v = this._rb.linearVelocity;
                    v.x = this.speed;
                    this._rb.linearVelocity = v;
                }
            }
        }
    }
}