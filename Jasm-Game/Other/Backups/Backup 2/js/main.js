// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xAAAAAA
});
document.querySelector("#gameDiv").appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

// TODO - This
app.loader.
    add([
        "images/JASM.png",
        "images/JASM_crouch.png",
        "images/Bullet.png",
        "images/block.png",
        "images/wall.png",
        "images/weakWall.png"

        // "images/explosions.png"
    ]);

// app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load();

// aliases
let stage;

// game variables
let startScene;
let gameScene, player, scoreLabel, shootSound, hitSound, jumpSound, block, wall, best = 0, bestLabel;
let gameOverScene;
let groundHeight = 120, groundSpeed = 400, blockSize = 50;

let walls = [];
let bullets = [];
let ground = [];
let keys = {};
let score = 0;
let paused = true;

let seconds = 0;

let gameOverScoreLabel;

function setup() {
    stage = app.stage;
    // keyboard event handler
    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);

    // #1 - Create the `start` scene
    startScene = new PIXI.Container();
    startScene.visible = true;
    stage.addChild(startScene);

    // #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    // #4 - Create labels for all 3 scenes
    createLabelsAndButtons();
    // #5 - Create Player
    player = new Player();
    gameScene.addChild(player);


    // #6 - Load Sounds
    /* EX
        shootSound = new Howl({
            src: ['sounds/shoot.wav']
        });

        hitSound = new Howl({
            src: ['sounds/hit.mp3']
        });
    */

    // #7 - Load sprite sheets (Call Method)

    // #8 - Start update loop
    app.ticker.add(gameLoop);
}

function keysDown(e) {
    // console.log(e.keyCode);
    keys[e.keyCode] = true;
    if (e.keyCode == 65) {
        //Shoot
        fireBullet();
    }

    if (e.keyCode == 32 && gameOverScene.visible) {
        startGame();
    }
}

function keysUp(e) {
    // console.log(e.keyCode);
    keys[e.keyCode] = false;
}

function createLabelsAndButtons() {
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 48,
        fontFamily: "Futura"
    });

    let startLabel1 = new PIXI.Text("Jump and\nShoot Man!");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 96,
        fontFamily: "Futura",
        stroke: 0x707070,
        strokeThickness: 6
    });
    startLabel1.x = 0;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);

    // Start Button
    let startButton = new PIXI.Text("Press to start");
    startButton.style = buttonStyle;
    startButton.x = 80;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame);
    startButton.on('pointerover', e => e.target.alpha = 0.7);
    startButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 18,
        fontFamily: "Futura",
        strokeThickness: 4
    });

    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Oof, you suck");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontFamily: "Futura",
        stroke: 0x707070,
        strokeThickness: 6
    });
    gameOverText.style = textStyle;
    gameOverText.x = 100;
    gameOverText.y = sceneHeight / 2 - 160;
    gameOverScene.addChild(gameOverText);

    gameOverScoreLabel = new PIXI.Text();
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 30,
        fontFamily: "Futura",
        stroke: 0x707070,
        strokeThickness: 4
    });
    gameOverScoreLabel.style = textStyle;
    gameOverScoreLabel.x = 170;
    gameOverScoreLabel.y = sceneHeight / 2 + 50;
    gameOverScene.addChild(gameOverScoreLabel);


    // 3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Try Again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 150;
    playAgainButton.y = sceneHeight - 100;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup", startGame); // startGame is a function reference
    playAgainButton.on('pointerover', e => e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);
}

function increaseScoreBy(value) {
    score += value;
    scoreLabel.text = `Score  ${Math.floor(score)}`;
}


function startGame() {
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;

    paused = false;
    for (let i = 0; i < 20; i++) {
        block = new Block(i * blockSize, app.view.height - groundHeight, blockSize, blockSize);
        ground.push(block);
        gameScene.addChild(block);
    }

    score = 0;
    player.xPos = 300;
    player.yPos = app.view.height - groundHeight - blockSize;
    player.vy = 1;
}

function gameLoop() {
    if (paused) return;
    // #1 - Calculate "delta time"
    let dt = 1 / app.ticker.FPS;
    if (dt > 1 / 12) dt = 1 / 12;

    GroundSpawning(dt);

    // Moving Bullets
    for (let b of bullets) {
        b.move(dt);
        if (b.x > app.view.width) {
            b.isAlive = false;
            gameScene.removeChild(b);
        }
    }

    // Moveing and Filtering
    for (let block of ground) {
        block.move(dt, groundSpeed);
        if (block.x <= -blockSize) {
            gameScene.removeChild(block);
        }
    }
    for (let wall of walls) {
        wall.move(dt, groundSpeed);
        if (wall.x <= -blockSize) {
            gameScene.removeChild(wall);
        }
    }
    ground = ground.filter(g => g.x > -blockSize);
    walls = walls.filter(w => w.x > -blockSize);

    player.Control(dt);
    player.Input();
    player.Draw();

    CheckCollisions(dt);

    increaseScoreBy(1 * dt);
    bullets = bullets.filter(b => b.isAlive);
    walls = walls.filter(w => w.isAlive);
}

function GroundSpawning(dt) {
    // Spawning
    if (ground[ground.length - 1].x + blockSize < app.view.width) {
        // How long the chain
        let chain = clamp(Math.floor(Math.random() * 30), 2, 10);

        // How far is the gap
        let small = 1;
        let addLarge = 3.5;
        let gap = Math.floor(Math.random() * 3) * addLarge + small;
        if (gap == 1) { gap = 0; }

        spawnBlocks(chain, gap);
    }
}

function spawnBlocks(chainLength, gap) {
    let obstacleIndex;
    // IF chain is long enough, there's a 90% chance an obstacle will spawn on it
    if (chainLength > 6) {
        if (Math.random() <= 0.9) {
            // Sets where the obstacle can spawn, between the third and 1 + half block
            obstacleIndex = Math.floor(getRandom(2, Math.floor(chainLength / 2))) + 1;
        } else {
            // The negative index will not be able to spawn obstacle
            obstacleIndex = -1;
        }
    }
    let edgeIndex = ground.length - 1;
    for (let i = 0; i < chainLength; i++) {
        // Creates the main ground chain starting outside right wall + the offset attribtue 
        block = new Block(ground[edgeIndex].x + blockSize + i * blockSize + gap * blockSize, app.view.height - groundHeight, blockSize, blockSize);
        ground.push(block);
        gameScene.addChild(block);

        // If there is an obstacle
        if (i == obstacleIndex) {
            // 50% chance to be obstacle, 50% to be wall to destroy
            if (Math.random() <= 0.75 && gap != 4.5) {
                SummonWall(i, gap);
            } else {
                SummonObstacle(i, gap);
            }
        }
    }
}

function SummonWall(i, gap) {
    let breakableIndex = Math.floor(getRandom(1, 5));
    for (let z = 0; z < 10; z++) {
        let destroyValue = false;
        let texture = "images/wall.png";
        if (score <= 75) {
            if (z == breakableIndex || z - 1 == breakableIndex || z + 1 == breakableIndex) {
                texture = "images/weakWall.png";
                destroyValue = true;
            }
        } else if (score > 75 && score <= 150) {
            if (z == breakableIndex || z + 1 == breakableIndex) {
                texture = "images/weakWall.png";
                destroyValue = true;
            }
        } else {
            if (z == breakableIndex) {
                texture = "images/weakWall.png";
                destroyValue = true;
            }
        }

        wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - blockSize - blockSize * z, blockSize, blockSize, texture);
        wall.destroyable = destroyValue;
        walls.push(wall);
        gameScene.addChild(wall);
    }
}

function SummonObstacle(i, gap) {
    // 50% chance to be jumping obstacle, 50% chance to be ducking
    if (Math.random() <= 0.5) {
        // At that index, spawn a block on top of the ground block
        wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - blockSize * 1, blockSize, blockSize * 1, "images/wall.png");
        walls.push(wall);
        gameScene.addChild(wall);

        // Each obstacle has a 50% chance to have a wall over them
        if (Math.random() <= 0.5) {
            // 50% chance for gap to be big enough to normally jump through, 50% to have to jump duck through
            // Based on the gapSize offset
            let gapSize = (Math.floor(Math.random() * 2) / 2) + 0.5
            wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - blockSize * (9 + gapSize), blockSize, blockSize * 6, "images/wall.png");
            walls.push(wall);
            gameScene.addChild(wall);
        }
    } else {
        wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - blockSize * (11.3), blockSize, blockSize * 10, "images/wall.png");
        walls.push(wall);
        gameScene.addChild(wall);
    }
}

function end() {
    paused = true;

    bullets.forEach(b => gameScene.removeChild(b));
    walls.forEach(w => gameScene.removeChild(w));
    ground.forEach(g => gameScene.removeChild(g));
    bullets = [];
    walls = [];
    ground = [];


    best = Math.max(best, score);
    gameOverScoreLabel.text = "Your final score: " + Math.floor(score) + "\nHigh Score: " + Math.floor(best);
    gameOverScene.visible = true;
    gameScene.visible = false;
}

function CheckCollisions(dt) {
    for (let w of walls) {
        for (let b of bullets) {
            if (rectsIntersect(b, w)) {
                if (w.destroyable) {
                    gameScene.removeChild(b);
                    walls.forEach(w => gameScene.removeChild(w));
                    walls.forEach(w => w.isAlive = false);
                    b.isAlive = false;
                } else {
                    gameScene.removeChild(b);
                    b.isAlive = false;
                }
            }
        }
        if (rectsIntersect(player, w)) {
            end();
        }
    }
}

function fireBullet(e) {
    // let rect = app.view.getBoundingClientRect();
    // let mouseX = e.clientX - rect.x;
    // let mouseY = e.clientY - rect.Y;
    // console.log(`${mouseX},${mouseY}`);
    if (paused) return;

    let b1;
    if (player.state == player.States.Run) {
        b1 = new Bullet(player.x + 25, player.y - 35);
    } else {
        b1 = new Bullet(player.x + 25, player.y - 25);
    }

    bullets.push(b1);
    gameScene.addChild(b1);
    // shootSound.play();
}

function loadSpriteSheet() {
    let spriteSheet = new PIXI.BaseTexture.from("images/explosions.png");
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures = [];
    for (let i = 0; i < numFrames; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i * width, 64, width, height));
        textures.push(frame);
    }
    return textures;
}

function createExplosion(x, y, frameWidth, frameHeight) {
    let w2 = frameWidth / 2;
    let h2 = frameHeight / 2;

    let expl = new PIXI.AnimatedSprite(explosionTextures);
    expl.x = x - w2;
    expl.y = y - h2;
    expl.animationSpeed = 1 / 7;
    expl.loop = false;
    expl.onComplete = e => gameScene.removeChild(expl);
    explosions.push(expl)
    gameScene.addChild(expl);
    expl.play();
}