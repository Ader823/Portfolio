import * as utils from './utils';
import { SpinSprite } from './spin-sprite';
import { StarSprite } from './star-sprite';
import { DrawParams } from './interfaces/drawParams.interface';


let ctx:CanvasRenderingContext2D, canvasWidth:number, canvasHeight:number, gradient:CanvasGradient, analyserNode: AnalyserNode, audioData:Uint8Array;
const BAR_WIDTH = 10;
const MAX_BAR_HEIGHT = 100;
const PADDING = 10;

let sprites = [];

const setupCanvas = (canvasElement: HTMLCanvasElement, analyserNodeRef: AnalyserNode) => {
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// create a gradient that runs top to bottom
	gradient = utils.getLinearGradient(ctx, 0, 0, 0, canvasHeight, [{ percent: 0, color: "rgba(0,212,255,1)" }, { percent: .12, color: "rgba(4,121,195,1)" }, { percent: .26, color: "rgba(9,9,121,1)" }, { percent: 1, color: "rgba(2,0,36,1)" }]);
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;
	// this is the array where the analyser data will be stored
	// analyserNode.fftSize = 64;
	audioData = new Uint8Array(analyserNode.fftSize / 2);

	generateStars();
	sprites[0] = new SpinSprite({x: canvasWidth / 2, y: canvasHeight / 2, width: 200, height: 200, path:'./media/images/earth.png'});
}

const draw = (params:DrawParams) => {
	// 1 - populate the audioData array with the frequency data from the analyserNode
	// notice these arrays are passed "by reference" 

	if (params.useFrequencyData) {
		analyserNode.getByteFrequencyData(audioData);
	} else {
		analyserNode.getByteTimeDomainData(audioData); // waveform data
	}

	// 2 - draw background
	ctx.save();
	ctx.fillStyle = "black";
	ctx.globalAlpha = 0.1;
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	ctx.restore();

	// 3 - draw gradient
	if (params.showGradient) {
		ctx.save();
		ctx.fillStyle = gradient;
		ctx.globalAlpha = 0.3;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		ctx.restore();
	}

	// 4 - draw bars
	if (params.showBars) {
		ctx.fillStyle = "rgb(0,0,0,.1)";
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		ctx.fillStyle = "red";
		ctx.save();
		ctx.translate(canvasWidth / 2, canvasHeight / 2 - 100);
		for (let b of Array.from(audioData)) {
			let percent = b / 255;
			if (percent < .02) percent = .02;
			ctx.translate(BAR_WIDTH, 0);
			ctx.rotate(Math.PI * 2 / 32);
			ctx.save();
			ctx.scale(1, -1);
			ctx.fillStyle = `rgb(${255 - b}, ${b * .8}, ${b})`;
			ctx.fillRect(0, 0, BAR_WIDTH, MAX_BAR_HEIGHT * percent ^ 2);

			ctx.fillStyle = `rgb(${b}, ${255 - b * .8}, ${255 - b})`;
			ctx.beginPath();
			ctx.arc(0, b ^ 2 / 12, 5, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			ctx.restore();
			ctx.translate(PADDING, 0);
		}
		ctx.restore();
	}

	for (let i = 1; i < params.numOfStars + 1; i++) {
		sprites[i + 1].draw(ctx);
		sprites[i + 1].update(audioData);
	}
	sprites[0].draw(ctx);
	sprites[0].update(audioData);

	// 5 - draw circles
	if (params.showCircles) {
		let maxRadius = canvasHeight / 4;
		ctx.save();
		ctx.globalAlpha = 0.2;
		for (let i = 0; i < audioData.length; i++) {
			// Circle Data
			let percent = audioData[i] / 255;
			ctx.lineWidth = percent * 10;
			let circleRadius = percent * maxRadius;
			// Cyan Circles
			ctx.beginPath();
			ctx.strokeStyle = utils.makeColor(0, 200, 200, 0.35 - percent / 3.0);
			ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();

			// Dark blue circles
			ctx.beginPath();
			ctx.strokeStyle = utils.makeColor(0, 0, 255, 0.1 - percent / 10.0);
			ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius * 1.5, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();

			// Small Pink Circles
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = utils.makeColor(200, 0, 200, 0.5 - percent / 5.0);
			ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius * .5, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();
			ctx.restore();
		}
		ctx.restore();

	}
	// 6 - bitmap manipulation
	// TODO: right now. we are looping though every pixel of the canvas (320,000 of them!), 
	// regardless of whether or not we are applying a pixel effect
	// At some point, refactor this code so that we are looping though the image data only if
	// it is necessary

	// A) grab all of the pixels on the canvas and put them in the `data` array
	// `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
	// the variable `data` below is a reference to that array 
	let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	let data = imageData.data;
	let length = data.length;
	let width = imageData.width;
	// B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
	for (let i = 0; i < length; i += 4) {
		// C) randomly change every 20th pixel to red
		if (params.showNoise && Math.random() < 0.05) {
			// data[i] is the red channel
			// data[i+1] is the green channel
			// data[i+2] is the blue channel
			// data[i+3] is the alpha channel
			data[i] = data[i + 1] = data[i + 2] = 0; // zero out the red and green and blue channels
			data[i] = 255; // make the red channel 100% red
		} // end if

		// Color Filters
		let red = data[i], green = data[i + 1], blue = data[i + 2];
		switch (params.colorFilter) {
			case "none":
				break;
			case "mars":
				data[i] = blue;
				data[i + 1] = green;
				data[i + 2] = red;
				break;
			case "uranus":
				data[i] = red;
				data[i + 1] = blue;
				data[i + 2] = green;
				break;
			case "saturn":
				data[i] = green;
				data[i + 1] = green;
				data[i + 2] = red;
				break;
			case "moon":
				data[i] = blue * .8;
				data[i + 1] = blue * .8;
				data[i + 2] = blue;
				break;
		}
		// Saturation / color boost
		data[i] *= params.saturation;
		data[i + 1] *= params.saturation;
		data[i + 2] *= params.saturation;

		if (params.showInvert) {
			let red = data[i], green = data[i + 1], blue = data[i + 2];
			data[i] = 255 - red;
			data[i + 1] = 255 - green;
			data[i + 2] = 255 - blue;
		}

	} // end for
	if (params.showEmboss) {
		for (let i = 0; i < length; i++) {
			if (i % 4 == 3) continue;
			data[i] = 127 + 2 * data[i] - data[i + 4] - data[i + width * 4];
		}
	}


	// D) copy image data back to canvas
	ctx.putImageData(imageData, 0, 0);


}

const generateStars = () => {
	for (let i = 0; i < 101; i++) {
		sprites[i + 1] = new StarSprite({x: utils.getRandom(0, canvasWidth), y: utils.getRandom(0, canvasHeight), spikes:4, outerRadius:15, innerRadius:5});
	}
}

export { setupCanvas, draw, generateStars };