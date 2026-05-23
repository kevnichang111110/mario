const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyController extends cc.Component {

    @property
    speed: number = -100;

    private _rb: cc.RigidBody = null;

    onLoad() {
        this._rb = this.getComponent(cc.RigidBody);
    }

    update(dt) {
        if (!this._rb) return;

        const v = this._rb.linearVelocity;
        v.x = this.speed;
        this._rb.linearVelocity = v;
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        // 玩家碰到怪物：不要讓物理引擎把雙方卡住
        const player = otherCollider.node.getComponent("PlayerController");
        if (player) {
            contact.disabled = true;
            return;
        }

        // 只要是側面撞到牆 / 方塊 / 其他障礙，就反向
        const worldManifold = contact.getWorldManifold();
        const normal = worldManifold.normal;

        if (Math.abs(normal.x) > 0.5) {
            this.speed *= -1;

            this.node.scaleX = this.speed > 0
                ? -Math.abs(this.node.scaleX)
                : Math.abs(this.node.scaleX);

            if (this._rb) {
                const v = this._rb.linearVelocity;
                v.x = this.speed;
                this._rb.linearVelocity = v;
            }
        }
    }

    public die() {
        this.speed = 0;

        const collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.sensor = true;

        cc.tween(this.node)
            .to(0.1, { scaleY: 0.1, opacity: 0 })
            .removeSelf()
            .start();
    }
}