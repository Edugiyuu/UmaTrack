const audioCache: { [key: string]: HTMLAudioElement } = {};

export function PlayAudio(audioFile: string, volume: number = 0.3) {
    if (audioCache[audioFile]) {
        audioCache[audioFile].pause();
        audioCache[audioFile].currentTime = 0;
    } else {
        audioCache[audioFile] = new Audio(audioFile);
    }
    audioCache[audioFile].volume = volume;
    audioCache[audioFile].play();
}