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
