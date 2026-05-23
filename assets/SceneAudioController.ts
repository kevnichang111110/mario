const { ccclass, property } = cc._decorator;

@ccclass
export default class SceneAudioController extends cc.Component {

    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    @property
    loop: boolean = true;

    onLoad() {
        // 當場景載入時，先停止目前的音樂，再播放此場景的音樂
        if (this.bgm) {
            // 停止舊的音樂（防止兩個場景的音樂疊在一起）
            cc.audioEngine.stopMusic();
            
            // 播放新的音樂
            cc.audioEngine.playMusic(this.bgm, this.loop);
        }
    }

    // 當離開此場景或該節點被銷毀時
    onDestroy() {
        // 如果你希望換場景時音樂立即切斷，可以保留這行
        // 如果你希望音樂自然銜接到下一首，可以註解掉
        // cc.audioEngine.stopMusic();
    }
}