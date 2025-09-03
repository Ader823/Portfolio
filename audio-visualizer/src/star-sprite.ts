export class StarSprite {
	static type = "star";
	x: number;
	y: number;
	spikes: number;
	outerRadius: number;
	innerRadius: number;
	scaleValue: number;
	maxSize: number;
	constructor({x, y, spikes, outerRadius, innerRadius}) {
		Object.assign(this, {x, y, spikes, outerRadius, innerRadius});
		this.scaleValue = 1;
		this.maxSize = 10;
	}

	update(audioData:Uint8Array) {
		let percent = audioData[20] / 255;
		this.scaleValue = this.maxSize * percent / 10;
	}

	draw(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.scale(this.scaleValue, this.scaleValue);
		let rot = Math.PI / 2 * 3;
		let x1 = this.x;
		let y1 = this.y;
		let step = Math.PI / this.spikes;

		ctx.strokeSyle = "#000";

		ctx.beginPath();

		ctx.moveTo(0, 0 - this.outerRadius)
		for (let i = 0; i < this.spikes; i++) {
			x1 = Math.cos(rot) * this.outerRadius;
			y1 = Math.sin(rot) * this.outerRadius;
			ctx.lineTo(x1, y1)
			rot += step

			x1 = Math.cos(rot) * this.innerRadius;
			y1 = Math.sin(rot) * this.innerRadius;
			ctx.lineTo(x1, y1)
			rot += step
		}
		ctx.lineTo(0, 0 - this.outerRadius)
		ctx.closePath();
		ctx.lineWidth = 5;
		ctx.strokeStyle = 'white';
		ctx.stroke();
		ctx.fillStyle = 'white';
		ctx.globalAlpha = .8;
		ctx.fill();
		ctx.restore();
	}
}
