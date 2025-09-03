// 1 - our WebAudio context, **we will export and make this public at the bottom of the file**
let audioCtx:AudioContext;

// **These are "private" properties - these will NOT be visible outside of this module (i.e. file)**
// 2 - WebAudio nodes that are part of our WebAudio audio routing graph
let element:HTMLAudioElement, sourceNode: AudioNode, analyserNode: AnalyserNode, gainNode: GainNode, biquadFilter: BiquadFilterNode, lowshelfBiquadFilter:BiquadFilterNode;

import { DEFAULTS } from "./enums/audio-defaults.enum";

// **Next are "public" methods - we are going to export all of these at the bottom of this file**
const setupWebaudio = (filepath: string) => {
    // 1 - The || is because WebAudio has not been standardized across browsers yet
    const AudioContext = window.AudioContext;
    audioCtx = new AudioContext();

    // 2 - this creates an <audio> element
    element = new Audio();

    // 3 - have it point at a sound file
    loadSoundFile(filepath);

    // 4 - create an a source node that points at the <audio> element
    sourceNode = audioCtx.createMediaElementSource(element);

    biquadFilter = audioCtx.createBiquadFilter();
    biquadFilter.type = "highshelf";
    // biquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    // biquadFilter.gain.setValueAtTime(20, audioCtx.currentTime);

    lowshelfBiquadFilter = audioCtx.createBiquadFilter();
    lowshelfBiquadFilter.type = "lowshelf";

    // 5 - create an analyser node
    // note the UK spelling of "Analyser"
    analyserNode = audioCtx.createAnalyser();

    // fft stands for Fast Fourier Transform
    analyserNode.fftSize = DEFAULTS.numSamples;

    // 7 - create a gain (volume) node
    gainNode = audioCtx.createGain();

    // 8 - connect the nodes - we now have an audio graph
    sourceNode.connect(lowshelfBiquadFilter);
    lowshelfBiquadFilter.connect(biquadFilter);
    biquadFilter.connect(analyserNode);
    analyserNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
}
const loadSoundFile = (filepath: string) => {
    element.src = filepath;
}

const playCurrentSound = () => {
    element.play();
}

const pauseCurrentSound = () => {
    element.pause();
}


const setHighshelf = (value: string) => {
    const valueNum = Number(value);
    biquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime); // we created the `biquadFilter` (i.e. "treble") node last time
    biquadFilter.gain.setValueAtTime(valueNum, audioCtx.currentTime);

}

const setLowshelf = (value: string) => {
    const valueNum = Number(value);
    lowshelfBiquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    lowshelfBiquadFilter.gain.setValueAtTime(valueNum, audioCtx.currentTime);
}

const setVolume = (value: string) => {
    const valueNum = Number(value);
    gainNode.gain.value = valueNum;
}
export { audioCtx, setupWebaudio, playCurrentSound, pauseCurrentSound, loadSoundFile, setVolume, analyserNode, setHighshelf, setLowshelf };