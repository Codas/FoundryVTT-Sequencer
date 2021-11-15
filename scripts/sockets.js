import SequencerAudioHelper from "./module/sequencer-audio-helper.js";
import { debug } from "./module/lib/lib.js";

const sequencerSocketEvent = "module.sequencer";

export const SOCKET_HANDLERS = {
    PLAY_EFFECT: "playEffect",
    END_EFFECTS: "endEffect",
    PLAY_SOUND: "playSound",
    PRELOAD: "preload",
    PRELOAD_RESPONSE: "preload_response",
    PRELOAD_DONE: "preload_done"
};

export function emitSocketEvent(handler, ...args) {
    debug(`Emitted socket message: ${handler}`, ...args)
    game.socket.emit(sequencerSocketEvent, { args, handler });
}

function onSocketEvent(socketData) {
    const { handler, args } = socketData;
    debug(`Received socket message: ${handler}`, args);
    switch (handler) {
        case SOCKET_HANDLERS.PLAY_EFFECT:
            return Sequencer.EffectManager._playEffect(...args);
        case SOCKET_HANDLERS.END_EFFECTS:
            return Sequencer.EffectManager._endEffects(...args);
        case SOCKET_HANDLERS.PLAY_SOUND:
            return SequencerAudioHelper.play(...args);
        case SOCKET_HANDLERS.PRELOAD:
            return Sequencer.Preloader.preload(...args);
        case SOCKET_HANDLERS.PRELOAD_RESPONSE:
            return Sequencer.Preloader.handleResponse(...args);
        case SOCKET_HANDLERS.PRELOAD_DONE:
            return Sequencer.Preloader.handleDone(...args);
        default:
            console.warn(`Sequencer | Received socket event for unknown handler '${handler}'`);
    }
}

export function registerSocket() {
    game.socket.on(sequencerSocketEvent, onSocketEvent);
    console.log("Sequencer | Registered socket");
}