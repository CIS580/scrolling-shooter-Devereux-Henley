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
