//Player object
class Player extends PIXI.AnimatedSprite {
    constructor(x = 0, y = 0) {
        super(playerSheet.run);
        super.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

        // Animation
        this.animationSpeed = 1 / 4;
        this.loop = true;
        this.textures = playerSheet.run;
        this.play();

        // Positioning and stuff
        this.anchor.set(.5, 1);
        this.scale.set(2);
        this.xPos = x;
        this.yPos = y;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;

        // Ground detection stuff
        this.grounded = false;
        this.prevGrounded = false;
        this.groundBelowCheck = false;
        this.framesAfterGroundBelowCheck = 0;
        this.States = { Run: 0, Crouch: 1, Fall: 2 };
        this.state = this.States.Run;

        // Collider stuff (I didn't know how to make it invisible (without it not working) so it's at a very low transparency)
        this.collider = new PIXI.Graphics();
        this.collider.beginFill(0x000000, 0.0000001);
        this.collider.drawRect(0, 0, 13, 36);
        this.collider.endFill();
        this.collider.x = x;
        this.collider.y = y;
        this.smallJ = false;
        this.justLanded = true;
        gameScene.addChild(this.collider);
        this.collider.pivot.set(0, 36);
        this.collider.scale.set(2);
    }

    // Handles drawing the animations depending on the player state
    Draw() {
        switch (this.state) {
            // Run animation
            case this.States.Run:
                if (this.textures != playerSheet.run) {
                    this.animationSpeed = 1 / 4;
                    this.textures = playerSheet.run;
                    this.loop = true;
                    this.onComplete = (e) => { }
                    this.play();
                }
                break;
            // Crouch animation
            case this.States.Crouch:
                if (this.textures != playerSheet.duck && this.textures != playerSheet.ducking) {
                    this.textures = playerSheet.duck;
                    this.loop = false;
                    this.onComplete = (e) => {
                        this.textures = playerSheet.ducking;
                        this.animationSpeed = 1 / 7;
                        this.play();
                    }
                    this.play();
                }

                break;
            // Fall animation
            case this.States.Fall:
                if (this.textures != playerSheet.jump && this.textures != playerSheet.fall) {
                    this.textures = playerSheet.jump;
                    this.loop = false;
                    this.onComplete = (e) => {
                        this.textures = playerSheet.fall;
                        this.play();
                    }
                    this.play();
                }
                break;
        }
    }

    // Handles player input and state managing
    Input() {
        // if crouch button, set to crouch state
        if (keys["83"]) {
            this.collider.height = 56;
            this.state = this.States.Crouch;
        } else {
            // not crouching and if not on ground, set to fall state,
            if (!this.grounded) {
                this.state = this.States.Fall;
            }
            // if not crouching, and if on ground, set to run state
            this.collider.height = 72;
            if (this.grounded) {
                this.state = this.States.Run;
            }
        }

        // If space bar is pressed,  
        if (keys["32"]) {
            if (player.grounded) {
                // If their grounded and running, do a small jump
                if (player.state == player.States.Run) {
                    this.smallJ = true;
                    player.vy = -500;
                    player.state = player.States.Fall;
                } else if (player.state == player.States.Crouch) {
                    // If their grounded and crouching, do a large jump
                    this.smallJ = false;
                    player.vy = -700;
                    player.state = player.States.Fall;
                }
            }
        }
    }

    // Handles the player controls
    Control(dt = 1 / 60) {
        // If they are above the ground
        if (this.y < app.view.height - groundHeight + 10) {
            // Set these to be false by default
            this.groundBelowCheck = false;
            this.grounded = false;
            
            for (let i = 0; i < ground.length; i++) {
                // If there is ground below, then set ground below to be true
                if (groundBelow(this, ground[i])) {
                    this.groundBelowCheck = true;
                }
                // If there is ground directly beneath the player, set grounded to true and state to run
                if (groundCheck(this, ground[i])) {
                    this.grounded = true;
                    player.state = player.States.Run;
                }
            }
            
            // Checks for small jump over long gap
            if (!this.prevGrounded && this.grounded && this.framesAfterGroundBelowCheck < 5) {
                if (this.smallJ && bigGap) {
                    bonus = 5;
                }
            }
            // Adds velocity to make player go down
            this.vy += 20;
            // If on the ground and player has velocity, make it 0.
            if (this.grounded) {
                if (this.vy > 0) {
                    this.vy = 0;
                }
            }
            // add velocity to position
            this.xPos += this.vx * dt;
            this.yPos += this.vy * dt;

            // set sprite position to calculated position
            this.x = this.xPos;
            this.collider.x = this.xPos;

            // Ground collision check
            if (this.groundBelowCheck && this.yPos < app.view.height - groundHeight) {
                this.y = clamp(this.yPos, 0, app.view.height - groundHeight);
                this.collider.y = clamp(this.yPos, 0, app.view.height - groundHeight);
            } else {
                // If not ground below, just set the position to whatever, don't stop at ground height
                this.y = this.yPos;
                this.collider.y = this.yPos;
            }
        } else {
            // If they are below the ground
            // Velocity should be added like usual
            this.vy += 20;

            //Add velocity to position
            this.xPos += this.vx * dt;
            this.yPos += this.vy * dt;

            // set sprite position to calculated position
            this.x = this.xPos;
            this.y = this.yPos;
            this.collider.x = this.xPos;
            this.collider.y = this.yPos;
        }
        // When they fall far enough, end the game
        if (this.yPos > app.view.height) {
            end();
        }
        // This is for small jump checks.
        this.prevGrounded = this.grounded;
        if (this.groundBelowCheck) {
            this.framesAfterGroundBelowCheck++;
        } else {
            this.framesAfterGroundBelowCheck = 0;
        }

    }
}
// Ground object
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

// Wall object, can be breakable or not
class Wall extends PIXI.Sprite {
    constructor(x = 0, y = 0, width = 32, height = 32, image = "images/block.png") {
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
// Bullet object
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