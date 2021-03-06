﻿class Game
{
    public motionKeys: boolean[] = [];

    public bullets: MovableObject[] = [];
    public players: Player[] = [];
    public asteroids: Asteroid[] = [];
    public enemies: Cube[] = [];

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private galaxy: Galaxy;
    // Images
    private galaxyBackground: HTMLElement;
    private energyIcon: HTMLElement;
    private healthIcon: HTMLElement;
    private shieldIcon: HTMLElement;

    private gameOver: boolean;

    public static xBound: number;
    public static yBound: number;

    constructor() {
        this.canvas = <HTMLCanvasElement> document.getElementById("world");
        Game.xBound = this.canvas.width = window.innerWidth;
        Game.yBound = this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");
        this.galaxy = new Galaxy();
        this.galaxyBackground = document.getElementById("galaxy");
        this.energyIcon = document.getElementById("energy-icon");
        this.healthIcon = document.getElementById("health-icon");
        this.shieldIcon = document.getElementById("shield-icon");
        this.gameOver = false;
    }

    public startGame() {
        this.spawnEnemies();
        this.drawLoop();
        this.movementLoop();
    }
    
    public spawnEnemies() {
        this.renderAsteroid(3 * Math.random());
        this.renderCube();
        setTimeout(() => {
            this.spawnEnemies();
        }, 2500);
    }

    public movementLoop() {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            player.handleKeys(this.motionKeys);
            player.handleMovement();

            for (var g = 0; g < this.asteroids.length; g++) {
                if (!player.dealingDamage && player.checkCollision(this.asteroids[g])) {
                    if (player.dealDamage(10)) {
                        this.gameOver = true;
                        return;
                    }
                }
            }
            for (var h = 0; h < this.enemies.length; h++) {
                if (!player.dealingDamage && player.checkCollision(this.enemies[h])) {
                    if (player.dealDamage(20)) {
                        this.gameOver = true;
                        return;
                    }
                }
            }

            player.checkBounds();
        }

        for (var i = 0; i < this.enemies.length; i++) {
            var enemy = this.enemies[i];
            enemy.handleMovement();

            if ((enemy.yPosition > 0 && enemy.checkBounds()) || (enemy.disappearing && enemy.bumpExplosion())) {
                this.enemies.splice(i, 1);
            }
        }

        for (var i = 0; i < this.asteroids.length; i++) {
            var asteroid = this.asteroids[i];
            asteroid.handleMovement();

            if ((asteroid.yPosition > 0 && asteroid.checkBounds()) || (asteroid.disappearing && asteroid.bumpExplosion())) {
                this.asteroids.splice(i, 1);
            }
        }

        for (var i = 0; i < this.bullets.length; i++) {
            var bullet = this.bullets[i];
            bullet.handleMovement();
            if (bullet.checkBounds()) {
                this.bullets.splice(i, 1);
            }
            for (var g = 0; g < this.asteroids.length; g++) {
                var asteroid = this.asteroids[g];
                if (bullet.checkCollision(asteroid)) {
                    asteroid.explode(this.context);
                    this.bullets.splice(i, 1);
                }
            }
            for (var h = 0; h < this.enemies.length; h++) {
                var enemy = this.enemies[h];
                if (bullet.checkCollision(enemy)) {
                    enemy.explode(this.context);
                    this.bullets.splice(i, 1);
                }
            }
        }

        setTimeout(() => {
            this.movementLoop();
        }, 16);
    }

    public renderAsteroid(ammount: number) {
        for (var i = 0; i < ammount; i++) {
            var x = Math.random() * (this.canvas.width - 72); // minus asteroid width
            var y = (Math.random() * this.canvas.height) - this.canvas.height;
            this.asteroids.push(new Asteroid(x, y));
        }
    }

    public renderCube() {
        var x = Math.random() * 540; // minus cube width
        var y = (Math.random() * this.canvas.height) - this.canvas.height;
        this.enemies.push(new Cube(x, y));
    }

    public drawLoop() {
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw galaxy
        this.context.drawImage(this.galaxyBackground, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
        this.galaxy.draw(this.context);
        // Draw players
        for (var i = 0; i < this.players.length; i++) {
            this.players[i].draw(this.context);
        }
        // Draw asteroids
        for (var i = 0; i < this.asteroids.length; i++) {
            this.asteroids[i].draw(this.context);
        }
        // Draw enemies
        for (var i = 0; i < this.enemies.length; i++) {
            this.enemies[i].draw(this.context);
        }
        // Draw bullets
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].draw(this.context);
        }
        // Draw statuses
        this.drawStatus(500, 20, 80, 20, "#FF0400", this.healthIcon, this.players[0].health); // Health
        this.drawStatus(500, 50, 80, 20, "#526CFF", this.shieldIcon, this.players[0].shield); // Shield
        this.drawStatus(500, 80, 80, 20, "#FFF700", this.energyIcon, this.players[0].energy); // Energy

        if (this.gameOver) {
            this.context.font = "30px Arial";
            this.context.fillStyle = "#FF0000";
            this.context.fillText("GAME OVER", 200, 300);
        } else {
            requestAnimationFrame(this.drawLoop.bind(this));
        }
    }

    private drawStatus(x: number, y: number, width: number, height: number, color: string, icon: HTMLElement, percentage: number) {
        this.context.strokeStyle = "#FFFFFF";
        this.context.beginPath();
        this.context.moveTo(x, y);
        this.context.lineTo(x + width, y);
        this.context.lineTo(x + width, y + height);
        this.context.lineTo(x, y + height);
        this.context.lineTo(x, y);
        this.context.stroke();
        this.context.fillStyle = color;
        this.context.fillRect(x + 1, y + 1, (width / 100 * percentage) - 2, height - 2);
        this.context.drawImage(icon, x - 30, y, 20, 20); 
    }

    public handleKeyPress(keyCode: number) {
        // Space
        if (keyCode == 32) {
            this.bullets.push(this.players[0].fireTorpedo());
        } else if (keyCode == 13) {
            this.bullets.push(this.players[0].fireLaser());
        }
    }
}

window.document.body.onload = function () {
    var tmpRequestAnimationFrame = (<any>window).requestAnimationFrame ||
        (<any>window).mozRequestAnimationFrame ||
        (<any>window).webkitRequestAnimationFrame ||
        (<any>window).msRequestAnimationFrame;
    window.requestAnimationFrame = tmpRequestAnimationFrame;

    var game = new Game();
    game.players.push(new Player(400, 400, 26, 50));

    window.addEventListener("keydown", function (e) {
        game.motionKeys[e.keyCode] = true;
    });
    window.addEventListener("keyup", function (e) {
        game.motionKeys[e.keyCode] = false;
    });
    window.addEventListener("keypress", function (e) {
        game.handleKeyPress(e.keyCode);
    });

    var menu = document.getElementById("menu");
    var startBtn = document.getElementById("start-button");
    startBtn.onclick = function () {
        menu.style.display = "none";
        game.startGame();
    };
};