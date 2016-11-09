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
