function GUI() {
	this.health = 5;
	this.health = 5;
}

var gui = new GUI();

GUI.prototype.setHealth = function(value, health) {
	var pr = value * 100/health;
	$("#playerFrame #health > div").css("width", pr + "%");
	$("#playerFrame #health > div").html(value + "/" + health);
}

GUI.prototype.setMana = function(value, mana) {
	var pr = value * 100/mana;
	$("#playerFrame #mana > div").css("width", pr + "%");
	$("#playerFrame #mana > div").html(value + "/" + mana);
}

GUI.prototype.setName = function(value) {
	$("#playerFrame #name > div").html(value);
}

GUI.prototype.setVictumName = function(value) {
	$("#victumFrame #name > div").html(value);
}