const {ccclass, property} = cc._decorator;

@ccclass
export default class CameraFollow extends cc.Component {
    @property(cc.Node)
    playerNode: cc.Node = null; // 在編輯器裡把 Player 拖進來

    update(dt) {
        if (!this.playerNode) return;
        
        // 讓攝影機的 X 座標跟著馬力歐
        // 這樣馬力歐不管走多遠，畫面都會跟著他
        this.node.x = this.playerNode.x;
    }
}