(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');
const Missile = require('./missile');
const Powerup = require('./powerups');
const EntityManager = require('./entity-manager');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var input = {
	up: false,
	down: false,
	left: false,
	right: false
}
var camera = new Camera(canvas);

var map = new Image();
map.src = 'assets/cobble.png';

var rocks = new Image();
rocks.src = 'assets/new_rocks.png';

var bits = new Image();
bits.src = 'assets/bits.png';

var entities = new EntityManager(canvas.width, canvas.height * 4, 128);
var powerupsToRemove = [];
var bullets = new BulletPool(10);
var missiles = [];
var powerups = [];
var powertypes = ['red', 'red', 'blue', 'blue', 'green'];
for(var i = 0; i < 5; i++) {
	var newp = new Powerup({x: Math.random() * 5 * 180, y: 500 + i * -700}, powertypes[i]);
	entities.addEntity(newp);
	powerups.push(newp);
}
var level = 1;
var player = new Player({x: 500, y: 500}, bullets, missiles);
entities.addEntity(player);
var missile_level = 1;

	/**
	 * @function onkeydown
	 * Handles keydown events
	 */
window.onkeydown = function(event) {
	switch(event.key) {
		case "ArrowUp":
		case "w":
			input.up = true;
			event.preventDefault();
			break;
		case "ArrowDown":
		case "s":
			input.down = true;
			event.preventDefault();
			break;
		case "ArrowLeft":
		case "a":
			input.left = true;
			event.preventDefault();
			break;
		case "ArrowRight":
		case "d":
			input.right = true;
			event.preventDefault();
			break;
		case " ":
			var new_missile = new Missile(player.position, missile_level);
			missiles.push(new_missile);
			entities.addEntity(new_missile);
			break;
	}
}

	/**
	 * @function onkeyup
	 * Handles keydown events
	 */
window.onkeyup = function(event) {
	switch(event.key) {
		case "ArrowUp":
		case "w":
			input.up = false;
			event.preventDefault();
			break;
		case "ArrowDown":
		case "s":
			input.down = false;
			event.preventDefault();
			break;
		case "ArrowLeft":
		case "a":
			input.left = false;
			event.preventDefault();
			break;
		case "ArrowRight":
		case "d":
			input.right = false;
			event.preventDefault();
			break;
	}
}

	/**
	 * @function masterLoop
	 * Advances the game in sync with the refresh rate of the screen
	 * @param {DOMHighResTimeStamp} timestamp the current time
	 */
var masterLoop = function(timestamp) {
	game.loop(timestamp);
	window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());

	/**
	 * @function update
	 * Updates the game state, moving
	 * game objects and handling interactions
	 * between them.
	 * @param {DOMHighResTimeStamp} elapsedTime indicates
	 * the number of milliseconds passed since the last frame.
	 */
function update(elapsedTime) {

	// update the player
	player.update(elapsedTime, input);	
	if(player.position.y < -3400) {
		level += 1;
		player.position.y = 500;
	}
	entities.updateEntity(player);

	// update the camera
	camera.update(player.position);

	// Update bullets
	bullets.update(elapsedTime, function(bullet){
		if(!camera.onScreen(bullet)) return true;
		return false;
	});

	// Update missiles
	var markedForRemoval = [];
	missiles.forEach(function(missile, i){
		missile.update(elapsedTime);
		if(Math.abs(missile.position.x - camera.x) > camera.width * 2) {
			entities.removeEntity(missile);
			markedForRemoval.unshift(i);
		}
	});
	// Remove missiles that have gone off-screen
	markedForRemoval.forEach(function(index){
		missiles.splice(index, 1);
	});

	entities.collide(function(entity1, entity2) {
		if(entity1 instanceof Player &&
			entity2 instanceof Powerup) { 
				switch(entity2.type) {
					case 'red':
						missile_level = 2;
						break;
					case 'blue':
						missile_level = 3;
						break;
					case 'green':
						missile_level = 1;
						break;
				}
				entities.removeEntity(entity2);
				powerups.splice(powerups.indexOf(entity2), 1);
			}
	});
}

	/**
	 * @function render
	 * Renders the current game state into a back buffer.
	 * @param {DOMHighResTimeStamp} elapsedTime indicates
	 * the number of milliseconds passed since the last frame.
	 * @param {CanvasRenderingContext2D} ctx the context to render to
	 */
function render(elapsedTime, ctx) {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, 1024, 786);

	// TODO: Render background

	ctx.save();
	ctx.translate(0, -camera.y * 0.6);
	ctx.drawImage(
		map,
		0, 0, 640, 1600,
		0, -3 * canvas.height, canvas.width, 4 * canvas.height);
	ctx.restore();

	ctx.save();
	ctx.translate(0, -camera.y * 0.8);
	ctx.drawImage(
		bits,
		0, 0, 640, 1600,
		0, -3 * canvas.height, canvas.width, 4 * canvas.height);
	ctx.restore();

	ctx.save();
	ctx.translate(0, -camera.y);
	ctx.drawImage(
		rocks,
		0, 0, 640, 1600,
		0, -3 * canvas.height, canvas.width, 4 * canvas.height);
	ctx.restore();


	// Transform the coordinate system using
	// the camera position BEFORE rendering
	// objects in the world - that way they
	// can be rendered in WORLD cooridnates
	// but appear in SCREEN coordinates
	ctx.save();
	ctx.translate(-camera.x, -camera.y);
	renderWorld(elapsedTime, ctx);
	ctx.restore();
	// Render the GUI without transforming the
	// coordinate system
	renderGUI(elapsedTime, ctx);
}

	/**
	 * @function renderWorld
	 * Renders the entities in the game world
	 * IN WORLD COORDINATES
	 * @param {DOMHighResTimeStamp} elapsedTime
	 * @param {CanvasRenderingContext2D} ctx the context to render to
	 */
function renderWorld(elapsedTime, ctx) {
	// Render the bullets	
	bullets.render(elapsedTime, ctx);

	powerups.forEach(function(powerup) {
		powerup.render(elapsedTime, ctx);
	});

	// Render the missiles	
	missiles.forEach(function(missile) {
		missile.render(elapsedTime, ctx);
	});

	// Render the player
	player.render(elapsedTime, ctx);
}

	/**
	 * @function renderGUI
	 * Renders the game's GUI IN SCREEN COORDINATES
	 * @param {DOMHighResTimeStamp} elapsedTime
	 * @param {CanvasRenderingContext2D} ctx
	 */
function renderGUI(elapsedTime, ctx) {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, 60);
	ctx.fillStyle = "white";
	ctx.font = "20px Arial";
	ctx.fillText("Level: " + level, 10, 40);
	ctx.fillText("Health: " + player.health, 150, 40);
}

},{"./bullet_pool":2,"./camera":3,"./entity-manager":4,"./game":5,"./missile":6,"./player":7,"./powerups":8,"./vector":10}],2:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = BulletPool;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function BulletPool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
BulletPool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
BulletPool.prototype.update = function(elapsedTime, callback) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
BulletPool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "black";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}

},{}],3:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');

/**
 * @module Camera
 * A class representing a simple camera
 */
module.exports = exports = Camera;

/**
 * @constructor Camera
 * Creates a camera
 * @param {Rect} screen the bounds of the screen
 */
function Camera(screen) {
  this.x = 0;
  this.y = 0;
  this.width = screen.width;
  this.height = screen.height;
}

/**
 * @function update
 * Updates the camera based on the supplied target
 * @param {Vector} target what the camera is looking at
 */
Camera.prototype.update = function(target) {
  // TODO: Align camera with player
  this.y = target.y - 500;
}

/**
 * @function onscreen
 * Determines if an object is within the camera's gaze
 * @param {Vector} target a point in the world
 * @return true if target is on-screen, false if not
 */
Camera.prototype.onScreen = function(target) {
  return (
     target.x > this.x &&
     target.x < this.x + this.width &&
     target.y > this.y &&
     target.y < this.y + this.height
   );
}

/**
 * @function toScreenCoordinates
 * Translates world coordinates into screen coordinates
 * @param {Vector} worldCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toScreenCoordinates = function(worldCoordinates) {
  return Vector.subtract(worldCoordinates, this);
}

/**
 * @function toWorldCoordinates
 * Translates screen coordinates into world coordinates
 * @param {Vector} screenCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toWorldCoordinates = function(screenCoordinates) {
  return Vector.add(screenCoordinates, this);
}

},{"./vector":10}],4:[function(require,module,exports){
module.exports = exports = EntityManager;

function EntityManager(width, height, cellSize) {
  this.cellSize = cellSize;
  this.widthInCells = Math.ceil(width / cellSize);
  this.heightInCells = Math.ceil(height / cellSize);
  this.cells = [];
  this.numberOfCells = this.widthInCells * this.heightInCells;
  for(var i = 0; i < this.numberOfCells; i++) {
    this.cells[i] = [];
  }
  this.cells[-1] = [];
}

function getIndex(x, y) {
  var x = Math.floor(x / this.cellSize);
  var y = Math.floor(y / this.cellSize);
  if(x < 0 ||
     x >= this.widthInCells ||
     y < 0 ||
     y >= this.heightInCells
  ) return -1;
  return y * this.widthInCells + x;
}

EntityManager.prototype.addEntity = function(entity){
  var index = getIndex.call(this, entity.position.x, entity.position.y);
  this.cells[index].push(entity);
  entity._cell = index;
}

EntityManager.prototype.updateEntity = function(entity){
  var index = getIndex.call(this, entity.position.x, entity.position.y);
  // If we moved to a new cell, remove from old and add to new
  if(index != entity._cell) {
    var cellIndex = this.cells[entity._cell].indexOf(entity);
    if(cellIndex != -1) this.cells[entity._cell].splice(cellIndex, 1);
    this.cells[index].push(entity);
    entity._cell = index;
  }
}

EntityManager.prototype.removeEntity = function(entity) {
  var cellIndex = this.cells[entity._cell].indexOf(entity);
  if(cellIndex != -1) this.cells[entity._cell].splice(cellIndex, 1);
  entity._cell = undefined;
}

EntityManager.prototype.collide = function(callback) {
  var self = this;
  this.cells.forEach(function(cell, i) {
    // test for collisions
    cell.forEach(function(entity1) {
      // check for collisions with cellmates
      cell.forEach(function(entity2) {
        if(entity1 != entity2) checkForCollision(entity1, entity2, callback);

        // check for collisions in cell to the right
        if(i % (self.widthInCells - 1) != 0) {
          self.cells[i+1].forEach(function(entity2) {
            checkForCollision(entity1, entity2, callback);
          });
        }

        // check for collisions in cell below
        if(i < self.numberOfCells - self.widthInCells) {
          self.cells[i+self.widthInCells].forEach(function(entity2){
            checkForCollision(entity1, entity2, callback);
          });
        }

        // check for collisions diagionally below and right
        if(i < self.numberOfCells - self.withInCells && i % (self.widthInCells - 1) != 0) {
          self.cells[i+self.widthInCells + 1].forEach(function(entity2){
            checkForCollision(entity1, entity2, callback);
          });
        }
      });
    });
  });
}

function checkForCollision(entity1, entity2, callback) {
  var collides = !(entity1.position.x + entity1.width < entity2.position.x ||
                   entity1.position.x > entity2.position.x + entity2.width ||
                   entity1.position.y + entity1.height < entity2.position.y ||
                   entity1.position.y > entity2.position.y + entity2.height);
  if(collides) {
    callback(entity1, entity2);
  }
}

EntityManager.prototype.renderCells = function(ctx) {
  for(var x = 0; x < this.widthInCells; x++) {
    for(var y = 0; y < this.heightInCells; y++) {
      ctx.strokeStyle = '#333333';
      ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
    }
  }
}

},{}],5:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],6:[function(require,module,exports){
"use strict";

const Vector = require('./vector');
const SmokeParticles = require('./smoke_particles');

const MISSILE_SPEED = -8;

module.exports = exports = Missile;

function Missile(position, level) {
	this.position = {x: position.x, y: position.y};
	this.angle = 0;
	this.velocity = {x: 0, y: MISSILE_SPEED};
	this.width = 8;
	this.height = 16;
	this.img = new Image();
	this.img.src = 'assets/newsh1.shp.000000.png';
	this.level = level;
	this.smokeParticles = new SmokeParticles(400);
}

Missile.prototype.update = function(elapsedTime) {	
	this.position.x += this.velocity.x;
	this.position.y += this.velocity.y;
	this.smokeParticles.emit(this.position);
	this.smokeParticles.update(elapsedTime);
}

Missile.prototype.render = function(elapsedTime, ctx) {
	var rgba;
	ctx.save();
	ctx.translate(this.position.x, this.position.y);
	switch(this.level) {
		case 1:
			ctx.drawImage(this.img, 130, 0, 28, 28, -4, 0, this.width, this.height);
			rgba = "160, 160, 160";
			break;
		case 2:
			ctx.drawImage(this.img, 153, 0, 28, 28, -4, 0, this.width, this.height);
			rgba = "254, 163, 163";
			break;
		case 3:
			ctx.drawImage(this.img, 179, 0, 28, 28, -4, 0, this.width, this.height);
			rgba = "255, 66, 66";
			break;
	}
	ctx.restore();
	this.smokeParticles.render(elapsedTime, ctx, rgba);
}

},{"./smoke_particles":9,"./vector":10}],7:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const Missile = require('./missile');

/* Constants */
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;

/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a player
 * @param {BulletPool} bullets the bullet pool
 */
function Player(position, bullets, missiles) {
  this.missiles = missiles;
  this.missileCount = 4;
  this.bullets = bullets;
  this.angle = 0;
  this.width = 23;
  this.height = 27;
  this.health = 100;
  this.position = position;
  this.velocity = {x: 0, y: 0};
  this.img = new Image()
  this.img.src = 'assets/tyrian.shp.007D3C.png';
}

/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime, input) {

  // set the velocity
  this.velocity.x = 0;
  if(input.left) this.velocity.x -= PLAYER_SPEED;
  if(input.right) this.velocity.x += PLAYER_SPEED;
  this.velocity.y = 0;
  if(input.up) this.velocity.y -= PLAYER_SPEED / 2;
  if(input.down) this.velocity.y += PLAYER_SPEED / 2;

  // determine player angle
  this.angle = 0;
  if(this.velocity.x < 0) this.angle = -1;
  if(this.velocity.x > 0) this.angle = 1;

  // move the player
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

  // don't let the player move off-screen
  if(this.position.x < 0) this.position.x = 0;
  if(this.position.x > 1024) this.position.x = 1024;
  if(this.position.y > 786) this.position.y = 786; 
}

/**
 * @function render
 * Renders the player helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.render = function(elapasedTime, ctx) {
  var offset = this.angle * 23;
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  ctx.drawImage(this.img, 48+offset, 57, 23, 27, -12.5, -12, this.width, this.height);
  ctx.restore();
}

/**
 * @function fireBullet
 * Fires a bullet
 * @param {Vector} direction
 */
Player.prototype.fireBullet = function(direction) {
  var position = Vector.add(this.position, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize(direction), BULLET_SPEED);
  this.bullets.add(position, velocity);
}

/**
 * @function fireMissile
 * Fires a missile, if the player still has missiles
 * to fire.
 */
Player.prototype.fireMissile = function() {
  if(this.missileCount > 0){
    var position = Vector.add(this.position, {x:0, y:30})
    var missile = new Missile(position);
    this.missiles.push(missile);
    this.missileCount--;
  }
}

},{"./missile":6,"./vector":10}],8:[function(require,module,exports){
"use strict";

module.exports = exports = Powerup;

function Powerup(position, ty) {
	this.position = {x: position.x, y: position.y};	
	this.width = 40;
	this.height = 40;
	this.type = ty;
	this.img = new Image();
	this.img.src = 'assets/newsh1.shp.000000.png';	
}

Powerup.prototype.update = function(elapsedTime) {	

}

Powerup.prototype.render = function(elapsedTime, ctx) {	
	ctx.save();
	ctx.translate(this.position.x, this.position.y);
	switch(this.type) {
		case 'red':
			ctx.fillStyle = "red";
			break;
		case 'blue':
			ctx.fillStyle = "blue";
			break;
		case 'green':
			ctx.fillStyle = 'green';
			break;
	}
	ctx.fillRect(0, 0, this.width, this.height);
	ctx.restore();
}

},{}],9:[function(require,module,exports){
"use strict";

/**
 * @module SmokeParticles
 * A class for managing a particle engine that
 * emulates a smoke trail
 */
module.exports = exports = SmokeParticles;

/**
 * @constructor SmokeParticles
 * Creates a SmokeParticles engine of the specified size
 * @param {uint} size the maximum number of particles to exist concurrently
 */
function SmokeParticles(maxSize) {
  this.pool = new Float32Array(3 * maxSize);
  this.start = 0;
  this.end = 0;
  this.wrapped = false;
  this.max = maxSize;
}

/**
 * @function emit
 * Adds a new particle at the given position
 * @param {Vector} position
*/
SmokeParticles.prototype.emit = function(position) {
  if(this.end != this.max) {
    this.pool[3*this.end] = position.x;
    this.pool[3*this.end+1] = position.y;
    this.pool[3*this.end+2] = 0.0;
    this.end++;
  } else {
    this.pool[3] = position.x;
    this.pool[4] = position.y;
    this.pool[5] = 0.0;
    this.end = 1;
  }
}

/**
 * @function update
 * Updates the particles
 * @param {DOMHighResTimeStamp} elapsedTime
 */
SmokeParticles.prototype.update = function(elapsedTime) {
  function updateParticle(i) {
    this.pool[3*i+2] += elapsedTime;
    if(this.pool[3*i+2] > 2000) this.start = i;
  }
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      updateParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      updateParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      updateParticle.call(this, i);
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
SmokeParticles.prototype.render = function(elapsedTime, ctx, rgba) {
  function renderParticle(i){
    var alpha = 1 - (this.pool[3*i+2] / 1000);
    var radius = 0.1 * this.pool[3*i+2];
    if(radius > 5) radius = 5;
    ctx.beginPath();
    ctx.arc(
      this.pool[3*i],   // X position
      this.pool[3*i+1], // y position
      radius, // radius
      0,
      2*Math.PI
    );
    ctx.fillStyle = 'rgba(' + rgba + ',' + alpha + ')';
    ctx.fill();
  }

  // Render the particles individually
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      renderParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      renderParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      renderParticle.call(this, i);
    }
  }
}

},{}],10:[function(require,module,exports){
"use strict";

/**
 * @module Vector
 * A library of vector functions.
 */
module.exports = exports = {
  add: add,
  subtract: subtract,
  scale: scale,
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}


/**
 * @function rotate
 * Scales a vector
 * @param {Vector} a - the vector to scale
 * @param {float} scale - the scalar to multiply the vector by
 * @returns a new vector representing the scaled original
 */
function scale(a, scale) {
 return {x: a.x * scale, y: a.y * scale};
}

/**
 * @function add
 * Computes the sum of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed sum
*/
function add(a, b) {
 return {x: a.x + b.x, y: a.y + b.y};
}

/**
 * @function subtract
 * Computes the difference of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed difference
 */
function subtract(a, b) {
  return {x: a.x - b.x, y: a.y - b.y};
}

/**
 * @function rotate
 * Rotates a vector about the Z-axis
 * @param {Vector} a - the vector to rotate
 * @param {float} angle - the angle to roatate by (in radians)
 * @returns a new vector representing the rotated original
 */
function rotate(a, angle) {
  return {
    x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
    y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
  }
}

/**
 * @function dotProduct
 * Computes the dot product of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed dot product
 */
function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y
}

/**
 * @function magnitude
 * Computes the magnitude of a vector
 * @param {Vector} a the vector
 * @returns the calculated magnitude
 */
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * @function normalize
 * Normalizes the vector
 * @param {Vector} a the vector to normalize
 * @returns a new vector that is the normalized original
 */
function normalize(a) {
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}]},{},[1]);
