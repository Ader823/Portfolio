import * as utils from './utils';
import * as audio from './audio';
import * as canvas from './canvas';
import { DrawParams } from './interfaces/drawParams.interface';
import { setupBurger } from './hamburger';

const Params: DrawParams = {
    showGradient: true,
    showBars: true,
    showCircles: true,
    showNoise: false,
    showInvert: false,
    showEmboss: false,
    useFrequencyData: true,
    numOfStars: 50,
    saturation: 0,
    colorFilter: "none"
};


// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
    sound1: "media/Your Love by The Outfield.mp3"
});


const init = () => {
    audio.setupWebaudio(DEFAULTS.sound1);
    console.log("init called");
    console.log(`Testing utils.getRandomColor() import: ${utils.getRandomColor()}`);
    let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
    loadJson();
    setupUI(canvasElement);
    canvas.setupCanvas(canvasElement, audio.analyserNode);

    loop();
}

const setupUI = (canvasElement: HTMLCanvasElement) => {
    setupBurger();

    let playButton = document.querySelector("#btn-play") as HTMLButtonElement;
    playButton.onclick = e => {
        let target = e.target as HTMLButtonElement;
        console.log(`audioCtx.state before = ${audio.audioCtx.state}`);

        if (audio.audioCtx.state == "suspended") {
            audio.audioCtx.resume();
        }
        console.log(`audioCtx.state after = ${audio.audioCtx.state}`);
        if (target.dataset.playing == "no") {
            audio.playCurrentSound();
            target.dataset.playing = "yes";
        } else {
            audio.pauseCurrentSound();
            target.dataset.playing = "no";
        }
    }

    // A - hookup fullscreen button
    const fsButton = document.querySelector("#fs-button") as HTMLButtonElement;

    // add .onclick event to button
    fsButton.onclick = e => {
        console.log("goFullscreen() called");
        utils.goFullscreen(canvasElement);
    };

    // C - hookup volume slider & label
    let volumeSlider = document.querySelector("#volume-slider") as HTMLInputElement;
    let volumeLabel = document.querySelector("#volume-label") as HTMLLabelElement;
    // add .oninput event to the slider
    volumeSlider.oninput = e => {
        // set the gain
        let target = e.target as HTMLInputElement;
        audio.setVolume(target.value);
        // Update value of label to match the value of the slider
        volumeLabel.innerHTML = Math.round((Number(target.value) / 2 * 100)).toString();
    }
    // Set value of label to match initial value of slider
    volumeSlider.dispatchEvent(new Event("input"));


    // D - hookup track <select>
    let trackSelect = document.querySelector("#track-select") as HTMLSelectElement
    // add .onchange event to select
    trackSelect.onchange = e => {
        let target =  e.target as HTMLSelectElement;
        audio.loadSoundFile(target.value);
        // pause it if currect track is playing
        if (playButton.dataset.playing == "yes") {
            playButton.dispatchEvent(new MouseEvent("click"));
        }
    }

    // Canvas Display Options
    let gradientCB = document.querySelector("#cb-gradient") as HTMLInputElement;
    gradientCB.checked = true;
    gradientCB.onchange = e => {
        let target = e.target as HTMLInputElement;
        Params.showGradient = target.checked;
    }

    let barsCB = document.querySelector("#cb-bars") as HTMLInputElement;
    barsCB.checked = true;
    barsCB.onchange = e => {
        let target = e.target as HTMLInputElement;
        Params.showBars = target.checked;
    }

    let circlesCB = document.querySelector("#cb-circles") as HTMLInputElement;
    circlesCB.checked = true;
    circlesCB.onchange = e => {
        let target = e.target as HTMLInputElement;
        Params.showCircles = target.checked;
    }

    let noiseCB = document.querySelector("#cb-noise") as HTMLInputElement;
    noiseCB.onchange = e => {
        let target = e.target as HTMLInputElement;
        Params.showNoise = target.checked;
    }
    let invertCB = document.querySelector("#cb-invert") as HTMLInputElement;
    invertCB.onchange = e => {
        let target = e.target as HTMLInputElement;
        Params.showInvert = target.checked;
    }

    let embossCB = document.querySelector("#cb-emboss") as HTMLInputElement;
    embossCB.onchange = e => {
        let target = e.target as HTMLInputElement;
        Params.showEmboss = target.checked;
    }

    //  THESE MIGHT BE INPUT ELEMENTS
    let btnFrequencyData = document.querySelector("#btn-frequency-data") as HTMLInputElement;
    let btnTimeData = document.querySelector("#btn-time-domain") as HTMLInputElement;
    btnFrequencyData.checked = Params.useFrequencyData;
    btnFrequencyData.onchange = e => {
        let target = e.target as HTMLButtonElement;
        Params.useFrequencyData = Boolean(target.value);

    }
    btnTimeData.onchange = e => {
        let target = e.target as HTMLInputElement;
        Params.useFrequencyData = Boolean(target.value);
    }

    // Bass Boost
    let bassSlider = document.querySelector("#bass-slider") as HTMLInputElement;
    let bassLabel = document.querySelector("#bass-label") as HTMLLabelElement;
    // add .oninput event to the slider
    bassSlider.oninput = e => {
        // set the gain
        let target = e.target as HTMLInputElement;
        audio.setLowshelf(target.value);
        // Update value of label to match the value of the slider
        bassLabel.innerHTML = target.value;
    }
    // Set value of label to match initial value of slider
    bassSlider.dispatchEvent(new Event("input"));

    // Trebble Boost
    let trebleSlider = document.querySelector("#treble-slider") as HTMLInputElement;
    let trebleLabel = document.querySelector("#treble-label") as HTMLInputElement;
    // add .oninput event to the slider
    trebleSlider.oninput = e => {
        // set the gain
        let target = e.target as HTMLInputElement;
        audio.setHighshelf(target.value);
        // Update value of label to match the value of the slider
        trebleLabel.innerHTML = target.value;
    }
    // Set value of label to match initial value of slider
    trebleSlider.dispatchEvent(new Event("input"));


    // Star Slider
    let starSlider = document.querySelector("#star-slider") as HTMLInputElement;
    starSlider.value = Params.numOfStars.toString();
    let starLabel = document.querySelector("#star-label") as HTMLLabelElement;
    // add .oninput event to the slider
    starSlider.oninput = e => {
        let target = e.target as HTMLInputElement;
        Params.numOfStars = Number(target.value);
        starLabel.innerHTML = target.value;
    }
    // Set value of label to match initial value of slider
    starSlider.dispatchEvent(new Event("input"));

    let btnRandStars = document.querySelector("#btn-stars") as HTMLButtonElement;
    btnRandStars.onclick = () => canvas.generateStars();


    // Saturation Slider
    let satSlider = document.querySelector("#sat-slider") as HTMLInputElement;
    satSlider.value = Params.saturation.toString();
    let satLabel = document.querySelector("#sat-label") as HTMLLabelElement;
    // add .oninput event to the slider
    satSlider.oninput = e => {
        let target = e.target as HTMLInputElement;
        Params.saturation = Number(target.value);
        satLabel.innerHTML = target.value;
    }
    // Set value of label to match initial value of slider
    satSlider.dispatchEvent(new Event("input"));


    // Color Filters
    let filterSelect = document.querySelector("#filter-select") as HTMLSelectElement;
    // add .onchange event to select
    filterSelect.onchange = e => {
        let target = e.target as HTMLSelectElement;
        Params.colorFilter = target.value; 
    }

} // end setupUI

const loop = () => {
    setTimeout(loop);
    canvas.draw(Params);
}

const jsonLoaded = e => {
    const string = e.target.responseText;
    let json;
    try {
        json = JSON.parse(string);
    } catch {
        return
    }
    // Reading the heading from the json
    document.querySelector("#heading").innerHTML = json.title;

    // Loading the audio files from the json
    let audioOptions = json.audioFiles;
    const audioHtml = audioOptions.map(w => `<option value="media/${w}.mp3"> ${w}</option>`).join("");
    document.querySelector("#track-select").innerHTML = audioHtml;

    // Loading the instructions from the json
    document.querySelector("#instructions").innerHTML = `<p>${json.instructions}</p>`
}

const loadJson = () => {
    const url = "data/av-data.json";
    const xhr = new XMLHttpRequest();
    xhr.onload = jsonLoaded;
    xhr.onerror = (e: Event) => {
        let target = e.target as XMLHttpRequest;
        console.log(`In error - HTTP Status Code = ${target.status}`);
    }
    xhr.open("GET", url);
    xhr.send();
};

export { init };