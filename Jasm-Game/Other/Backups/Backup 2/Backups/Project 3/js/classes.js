// class Ship extends PIXI.Sprite {
//     constructor(x = 0, y = 0){
//         //Fill IN
//         super(app.loader.resources[""].texture);
//         this.anchor.set(.5, .5);
//         this.scale.set(0.1);
//         this.x = x;
//         this.y = y;
//     }
// }

class Player extends PIXI.Sprite {
    constructor(x = 0, y = 0) {
        super(app.loader.resources["images/JASM.png"].texture);
        super.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        this.anchor.set(.5, 1);
        this.scale.set(2);
        this.xPos = x;
        this.yPos = y;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.groundBelowCheck = false;
        this.States = { Run: 0, Crouch: 1 };
        this.state = this.States.Run;
    }

    Input() {
        // get velocity
        if (keys["87"]) {
            if (this.grounded) {
                if (this.state == this.States.Run){
                    this.vy = -500;
                }else if (this.state == this.States.Crouch){
                    this.vy = -700;
                }
            }
        }
        if (keys["83"]) {
            this.state = this.States.Crouch;
        } else {
            this.state = this.States.Run;
        }
    }

    Draw() {
        if (this.state == this.States.Run) {
            this.texture = app.loader.resources["images/JASM.png"].texture;
            this.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        } else if (this.state == this.States.Crouch) {
            this.texture = app.loader.resources["images/JASM_crouch.png"].texture;
            this.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        }
    }

    Control(dt = 1 / 60) {
        if (this.y < app.view.height - groundHeight + 10){
            this.groundBelowCheck = false;
            this.grounded = false;
            for (let i = 0; i < ground.length; i++) {
                if (groundBelow(this, ground[i])) {
                    this.groundBelowCheck = true;
                }
                if (groundCheck(this, ground[i])) {
                    this.grounded = true;
                }
            }
    
            this.vy += 20;
            if (this.grounded) {
                if (this.vy > 0) {
                    this.vy = 0;
                }
            }
            // add to position
            this.xPos += this.vx * dt;
            this.yPos += this.vy * dt;
    
            // set position to position
            this.x = this.xPos;
            if (this.groundBelowCheck && this.yPos < app.view.height - groundHeight) {
                this.y = clamp(this.yPos, 0, app.view.height - groundHeight);
            } else {
                this.y = this.yPos;
            }
        }else{
            this.vy += 20;

            this.xPos += this.vx * dt;
            this.yPos += this.vy * dt;

            this.x = this.xPos;
            this.y = this.yPos;
        }
        if (this.yPos > app.view.height){
            end();
        }

    }
}

class Block extends PIXI.Sprite {
    constructor(x = 0, y = 0, width = 32, height = 32) {
        super(app.loader.resources["images/block.png"].texture);
        super.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        // this.anchor.set(.5, .5);
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
    move(dt = 1 / 60, speed) {
        this.x -= speed * dt;
    }
}

class Wall extends PIXI.Sprite{
    constructor(x = 0, y = 0, width = 32, height = 32, image="images/block.png") {
        super(app.loader.resources[image].texture);
        super.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        // this.anchor.set(.5, .5);
        this.destroyable = false;
        this.width = width;
        this.height = height;
        this.isAlive = true;
        this.x = x;
        this.y = y;
    }
    move(dt = 1 / 60, speed) {
        this.x -= speed * dt;
    }
}

class Circle extends PIXI.Graphics {
    constructor(radius, color = 0XFF0000, x = 0, y = 0) {
        super();
        this.beginFill(color);
        this.drawCircle(0, 0, radius);
        this.endFill();
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.fwd = getRandomUnitVector();
        this.speed = 50;
        this.isAlive = true;
    }
    move(dt = 1 / 60) {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }

    reflectX() {
        this.fwd.x *= -1;
    }

    reflectY() {
        this.fwd.y *= -1;
    }
}

class Bullet extends PIXI.Sprite {
    constructor(x = 0, y = 0) {
        super(app.loader.resources["images/Bullet.png"].texture);
        this.x = x;
        this.y = y;

        this.fwd = { x: 1, y: 0 };
        this.speed = 400;
        this.isAlive = true;
        Object.seal(this)
    }

    move(dt = 1 / 60) {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}