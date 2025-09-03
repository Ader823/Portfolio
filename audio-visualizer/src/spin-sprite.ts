export class SpinSprite {
	static type = "image";
	x: number;
	y: number;
	width: number;
	height: number;
	path: string;
	rotateAmount: number;

	constructor({x, y, width, height, path}) {
		this.rotateAmount = .1;
		Object.assign(this, {x, y, width, height, path});

	}
	update(audioData:Uint8Array) {
		// ctx.globalAlpha = 0.5;
		for (let i = 0; i < audioData.length; i++) {
			// red - ish circles
			let percent = audioData[i] / 255;
			this.rotateAmount += percent / 255;
		}
	}

	draw(ctx) {
		const img = new Image();
		img.src = this.path;
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rotateAmount);

		ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
		ctx.restore();

	}
}