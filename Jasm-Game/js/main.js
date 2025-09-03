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

//Background stuff
let bg1;
let bg2;
let bg3;
let bg4;
let bg5;
let bgX = 0;
let bgSpeed = 1;
let bgUpdated = false;
let homeBg;

// Asset loading
app.loader.
    add([
        "images/JASM.png",
        "images/Jasm_homescreen.png",
        "images/goBackground1.png",
        "images/goBackground2.png",
        "images/goBackground3.png",
        "images/JASM_crouch.png",
        "images/Bullet.png",
        "images/block.png",
        "images/wall.png",
        "images/weakWall1.png",
        "images/weakWall2.png",
        "images/weakWall3.png",
        "images/weakWall4.png",
        "images/Jasm_spritesheet.png",
        "images/Backgrounds/bl1.png",
        "images/Backgrounds/bl2.png",
        "images/Backgrounds/bl3.png",
        "images/Backgrounds/bl4.png",
        "images/Backgrounds/bl5.png",
        "images/Backgrounds/b1.png",
        "images/Backgrounds/b2.png",
        "images/Backgrounds/b3.png",
        "images/Backgrounds/b4.png",
        "images/Backgrounds/b5.png",
        "images/Backgrounds/r1.png",
        "images/Backgrounds/r2.png",
        "images/Backgrounds/r3.png",
        "images/Backgrounds/r4.png",
        "images/Backgrounds/r5.png",
    ]);

app.loader.onComplete.add(setup);
app.loader.load();

// aliases
let stage;

// game variables. So many game variables.
let startScene;
let gameScene, player, scoreLabel, soundtrack, block, wall, best = 0, bestLabel, hmscrn, goBg, bigGap = false, bonus = 0;
let gameOverScene;
let groundHeight = 120, groundSpeed = 400, blockSize = 50;

let playerSheet = {};

let walls = [];
let bullets = [];
let canShoot = true;
let ground = [];
let keys = {};
let score = 0;
let paused = true;

let secondsPassed = 0;

let gameOverScoreLabel;

function setup() {
    stage = app.stage;
    // keyboard event handler
    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);

    // Create the `start` scene
    startScene = new PIXI.Container();
    startScene.visible = true;
    stage.addChild(startScene);

    // Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);


    // Load the backgrounds for the game
    bg5 = createBG(app.loader.resources["images/Backgrounds/bl5.png"].texture);
    bg4 = createBG(app.loader.resources["images/Backgrounds/bl4.png"].texture);
    bg3 = createBG(app.loader.resources["images/Backgrounds/bl3.png"].texture);
    bg2 = createBG(app.loader.resources["images/Backgrounds/bl2.png"].texture);
    bg1 = createBG(app.loader.resources["images/Backgrounds/bl1.png"].texture);

    // load the backgrounds for the start screen and game over screen
    homeBg = new PIXI.Sprite(app.loader.resources["images/Jasm_homescreen.png"].texture);
    startScene.addChild(homeBg);

    goBg = new PIXI.Sprite(app.loader.resources["images/goBackground1.png"].texture);
    gameOverScene.addChild(goBg);

    //Create labels for all 3 scenes
    createLabelsAndButtons();

    // Create Player
    loadPlayerSpriteSheet();
    player = new Player();
    gameScene.addChild(player);


    // Load Sounds
    soundtrack = new Howl({
        src: ['sounds/soundtrack.m4a']
    });
    soundtrack.loop(true);
    soundtrack.play();


    // Start update loop
    app.ticker.add(gameLoop);
}

// Creates the tiling backgrounds
function createBG(texture) {
    let tiling = new PIXI.TilingSprite(texture, 800, 600);
    tiling.position.set(0, 0);
    gameScene.addChild(tiling);
    return tiling;
}
// Moves the backgrounds
function updateBG() {
    bgX = (bgX - bgSpeed);
    bg1.tilePosition.x = bgX;
    bg2.tilePosition.x = bgX / 2;
    bg3.tilePosition.x = bgX / 4;
    bg4.tilePosition.x = bgX / 8;
}

// Handles shooting and starting the game (along with updating keys array)
function keysDown(e) {
    keys[e.keyCode] = true;
    if (e.keyCode == 65) {
        //Shoot
        if (canShoot) {
            fireBullet();
            canShoot = false;
        }
    }

    if (e.keyCode == 32 && gameOverScene.visible || startScene.visible) {
        startGame();
    }
}

// Makes sure there's no autofire (along with updating keys array)
function keysUp(e) {
    // console.log(e.keyCode);
    keys[e.keyCode] = false;
    if (e.keyCode == 65) {
        canShoot = true;
    }
}

function createLabelsAndButtons() {
    // Start button style
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 48,
        fontWeight: 900,
        fontFamily: ['Euphemia UCAS', 'Arial'],
    });


    // Start Button
    let startButton = new PIXI.Text("Press to start");
    startButton.style = buttonStyle;
    startButton.x = app.view.width / 2 - 150;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame);
    startButton.on('pointerover', e => e.target.alpha = 0.7);
    startButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    // Score display style
    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 80,
        fontWeight: 900,
        fontFamily: ['Euphemia UCAS', 'Arial'],
    });

    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.alpha = 0.5;
    scoreLabel.x = 20;
    scoreLabel.y = 20;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // Game over text
    let gameOverText = new PIXI.Text("OOF YOU SUCK!");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontWeight: 600,
        fontFamily: ['Euphemia UCAS', 'Arial'],
    });
    gameOverText.style = textStyle;
    gameOverText.x = 140;
    gameOverText.y = sceneHeight / 2 - 160;
    gameOverScene.addChild(gameOverText);

    // Score label after game over
    gameOverScoreLabel = new PIXI.Text();
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 30,
        fontFamily: ['Euphemia UCAS', 'Arial'],
        align: "right",
        lineHeight: 45,
    });
    gameOverScoreLabel.style = textStyle;
    gameOverScoreLabel.x = sceneWidth / 2 - 130;
    gameOverScoreLabel.y = sceneHeight / 2 + 100;
    gameOverScene.addChild(gameOverScoreLabel);


    // Play again button
    let playAgainButton = new PIXI.Text("Try Again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = sceneWidth / 2 - 120;
    playAgainButton.y = sceneHeight - 100;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup", startGame); // startGame is a function reference
    playAgainButton.on('pointerover', e => e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);
}

// Increases and displays score
function increaseScoreBy(value) {
    score += value;
    // If there is a bonus, show it for 1 second, then add it to the score
    if (bonus > 0) {
        secondsPassed += value;
        scoreLabel.text = `SCORE: ${Math.floor(score)}+${bonus}`;
        if (secondsPassed >= 1) {
            score += bonus;
            bonus = 0;
            secondsPassed = 0;
        }
    } else {
        scoreLabel.text = `SCORE: ${Math.floor(score)}`;
        secondsPassed = 0;
    }

}

// Called when game starts, resets everything
function startGame() {
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    goBg.texture = app.loader.resources["images/goBackground1.png"].texture;
    bgUpdated = false;
    bg5.texture = app.loader.resources["images/Backgrounds/bl5.png"].texture;
    bg4.texture = app.loader.resources["images/Backgrounds/bl4.png"].texture;
    bg3.texture = app.loader.resources["images/Backgrounds/bl3.png"].texture;
    bg2.texture = app.loader.resources["images/Backgrounds/bl2.png"].texture;
    bg1.texture = app.loader.resources["images/Backgrounds/bl1.png"].texture;

    paused = false;
    // Starting blocks, can make as long as want
    for (let i = 0; i < 20; i++) {
        block = new Block(i * blockSize, app.view.height - groundHeight, blockSize, blockSize);
        ground.push(block);
        gameScene.addChild(block);
    }

    // Reseting settings and setting player pos
    bigGap = false;
    score = 0;
    player.xPos = 300;
    player.yPos = app.view.height - groundHeight;
    player.vy = 1;
}

function gameLoop() {
    if (paused) return;

    // #1 - Calculate "delta time"
    let dt = 1 / app.ticker.FPS;
    if (dt > 1 / 12) dt = 1 / 12;

    // Updates the background
    updateBG();

    // Depending on the score, change the background to reflect level.
    // Make sure the gap between the two numbers in the if statements is greater than the max bonus (5 right now)
    if (score >= 75 && score < 85 && !bgUpdated) {
        bgUpdated = true;
        bg5.texture = app.loader.resources["images/Backgrounds/r5.png"].texture;
        bg4.texture = app.loader.resources["images/Backgrounds/r4.png"].texture;
        bg3.texture = app.loader.resources["images/Backgrounds/r3.png"].texture;
        bg2.texture = app.loader.resources["images/Backgrounds/r2.png"].texture;
        bg1.texture = app.loader.resources["images/Backgrounds/r1.png"].texture;

        goBg.texture = app.loader.resources["images/goBackground2.png"].texture;
    }
    if (score >= 86 && score < 96) {
        bgUpdated = false;
    }
    if (score >= 150 && score < 160 && !bgUpdated) {
        bgUpdated = true;
        bg5.texture = app.loader.resources["images/Backgrounds/b5.png"].texture;
        bg4.texture = app.loader.resources["images/Backgrounds/b4.png"].texture;
        bg3.texture = app.loader.resources["images/Backgrounds/b3.png"].texture;
        bg2.texture = app.loader.resources["images/Backgrounds/b2.png"].texture;
        bg1.texture = app.loader.resources["images/Backgrounds/b1.png"].texture;

        goBg.texture = app.loader.resources["images/goBackground3.png"].texture;
    }

    // Spawns the ground
    GroundSpawning(dt);

    // Moving Bullets
    for (let b of bullets) {
        b.move(dt);
        if (b.x > app.view.width) {
            b.isAlive = false;
            gameScene.removeChild(b);
        }
    }

    // Moving and Filtering
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

    bullets = bullets.filter(b => b.isAlive);
    walls = walls.filter(w => w.isAlive);

    // Player update functions
    player.Control(dt);
    player.Input();
    player.Draw();

    // Checking collisions
    CheckCollisions(dt);

    // Increase the score every frame
    increaseScoreBy(1 * dt);
}

// Checks if player does a short jump when there's a big gap on screen
function checkCool() {
    if (bigGap && player.smallJ) {
        return true;
    } else {
        return false;
    }
}

// Gets the info for how the ground will spawn
function GroundSpawning(dt) {
    // If the full ground is on screen, start spanwing the next one
    if (ground[ground.length - 1].x + blockSize < app.view.width) {
        // How long the chain (any where from 2 to 10, but most likely 10)
        let chain = clamp(Math.floor(Math.random() * 30), 2, 10);

        // How far is the gap (This will either produce a gap of 0, 4, or 8)
        let small = 1;
        let addLarge = 3.5;
        let gap = Math.floor(Math.random() * 3) * addLarge + small;
        if (gap == 1) { gap = 0; }
        if (gap == 8) { bigGap = true; } else { bigGap = false; }

        // Actually spawns the blocks
        spawnBlocks(chain, gap);
    }
}

// Spawns the ground and handles spawning obstacles
function spawnBlocks(chainLength, gap) {
    let obstacleIndex;
    // If chain is long enough, there's a 90% chance an obstacle will spawn on it
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

// Summons a wall
function SummonWall(i, gap) {
    // Makes a random index on the wall (between 1 and 5) the spot thats breakable.
    let breakableIndex = Math.floor(getRandom(1, 5));
    // There are Different wall textures for different spots
    for (let z = 0; z < 10; z++) {
        let destroyValue = false;
        let texture = "images/wall.png";
        // If the score is less than 75, easy mode, 3 walls will be breakable around the index
        if (score <= 75) {
            if (z == breakableIndex) {
                texture = "images/weakWall2.png";
                destroyValue = true;
            } else if (z - 1 == breakableIndex) {
                texture = "images/weakWall3.png";
                destroyValue = true;
            } else if (z + 1 == breakableIndex) {
                texture = "images/weakWall1.png";
                destroyValue = true;
            }
            // If the score is between 75 and 150, medium mode, 2 walls will be breakable
        } else if (score > 75 && score <= 150) {
            if (z == breakableIndex) {
                texture = "images/weakWall3.png";
                destroyValue = true;
            } else if (z + 1 == breakableIndex) {
                texture = "images/weakWall1.png";
                destroyValue = true;
            }
        } else {
            // Over 150, hard mode, one wall will be breakable
            if (z == breakableIndex) {
                texture = "images/weakWall4.png";
                destroyValue = true;
            }
        }

        // Makes the walls
        wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - blockSize - blockSize * z, blockSize, blockSize, texture);
        wall.destroyable = destroyValue;
        walls.push(wall);
        gameScene.addChild(wall);
    }
}

// Summons Obstacles
function SummonObstacle(i, gap) {
    // 50% chance to be jumping obstacle, 50% chance to be ducking
    if (Math.random() <= 0.5) {
        // Jump obstacle
        // At that index, spawn a block on top of the ground block
        wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - blockSize * 1, blockSize, blockSize * 1, "images/wall.png");
        walls.push(wall);
        gameScene.addChild(wall);

        // Each obstacle has a 80% chance to have a wall over them
        if (Math.random() <= 0.80) {
            // 50% chance for gap to be big enough to normally jump through, 50% to have to jump duck through
            // Based on the gapSize offset
            let gapSize = (Math.floor(Math.random() * 2));
            for (let z = 0; z < 8; z++) {
                wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - z * blockSize - (4.5 * blockSize + 15 * gapSize), blockSize, blockSize, "images/wall.png");
                walls.push(wall);
                gameScene.addChild(wall);
            }

        }
    } else {
        // Duck obstacle
        for (let z = 0; z < 10; z++) {
            wall = new Wall(app.view.width + i * blockSize + gap * blockSize, app.view.height - groundHeight - z * blockSize - (2.3 * blockSize), blockSize, blockSize, "images/wall.png");
            walls.push(wall);
            gameScene.addChild(wall);
        }
    }
}

// When the player dies
function end() {
    // Stop the game, if there's a bonus, add it
    paused = true;
    score += bonus;
    bonus = 0;

    // Clear out objects
    bullets.forEach(b => gameScene.removeChild(b));
    walls.forEach(w => gameScene.removeChild(w));
    ground.forEach(g => gameScene.removeChild(g));
    bullets = [];
    walls = [];
    ground = [];

    // Handles high score and score display
    best = Math.max(best, score);
    gameOverScoreLabel.text = "Your final score: " + Math.floor(score) + "\nHigh Score: " + Math.floor(best);
    gameOverScene.visible = true;
    gameScene.visible = false;
}

// Collision Check
function CheckCollisions(dt) {
    for (let w of walls) {
        for (let b of bullets) {
            // Wall and bullet collisions
            if (rectsIntersect(b, w)) {
                if (w.destroyable) {
                    // If the bullet hits the destroyable wall, it will clear all the obstacles on the screen
                    gameScene.removeChild(b);
                    walls.forEach(w => gameScene.removeChild(w));
                    walls.forEach(w => w.isAlive = false);
                    b.isAlive = false;
                } else {
                    // Other wise, destroy the bullet
                    gameScene.removeChild(b);
                    b.isAlive = false;
                }
            }
        }
        // Check player collisions, if there's a hit, end the  game
        if (rectsIntersect(player.collider, w)) {
            end();
        }
    }
}
// Fires the bullet
function fireBullet(e) {
    if (paused) return;
    let b1;
    // If the player is crouching, fire it lower
    if (player.state == player.States.Crouch) {
        b1 = new Bullet(player.x + 25, player.y - 25);

    } else {
        b1 = new Bullet(player.x + 25, player.y - 45);
    }

    bullets.push(b1);
    gameScene.addChild(b1);
}

// Player sprite sheet
function loadPlayerSpriteSheet() {
    // get the spritesheet image
    let spriteSheet = new PIXI.BaseTexture.from("images/Jasm_spritesheet.png");

    // Run cycle from spritesheet
    playerSheet["run"] = [];
    for (let i = 0; i < 10; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i * 41, 0, 41, 38));
        playerSheet["run"].push(frame);
    }
    // Ducking transition from spritesheet
    playerSheet["duck"] = [];
    for (let i = 0; i < 1; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i * 41, 38, 41, 38));
        playerSheet["duck"].push(frame);
    }
    // Ducking animation from spritesheet
    playerSheet["ducking"] = [];
    for (let i = 0; i < 4; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(41 + i * 41, 38, 41, 38));
        playerSheet["ducking"].push(frame);
    }
    // Jumping animation from spritesheet
    playerSheet["jump"] = [];
    for (let i = 0; i < 5; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i * 41, 76, 41, 38));
        playerSheet["jump"].push(frame);
    }
    // Falling animation from spritesheet
    playerSheet["fall"] = [];
    for (let i = 0; i < 1; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(4 * 41, 76, 41, 38));
        playerSheet["fall"].push(frame);
    }


}
