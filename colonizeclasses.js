// Colonizeable planet
function Planet(name, forces) {
    this.name = name;
    this.forces = forces;
    this.biomes = [];
    this.pods = [];
}
    
Planet.prototype.getName = function() {
    return this.name;
}

// Solar system containing colonizable planets
function SolarSystem(name, planets) {
    this.name = name;
    this.planets = planets;
    this.vessels = [];
}

SolarSystem.prototype.getName = function() {
    return this.name;
}


// Used to colonize a planet
function Pod (forces, id, vesselID){
    this.forces = forces;
    this.id = id;
    this.vesselID = vesselID;
    this.docked = true;
    this.planet = 'none';
    this.maxHealth = 100;
    this.health = this.maxHealth;
}

Pod.prototype.getName = function() {
    return "Pod " + this.id;
}

Pod.prototype.getLocation = function() {
    if(this.docked = true){
        return 'Docked on ' + vessels[this.vesselID].getName() + '.';
    }
    else{
        return 'Deployed on planet ' + this.planet.getName() + '.';
    }
}

Pod.prototype.getIntegrity = function() {
    var approx = roundToNearestTen(this.health)/10; /* To make it 0-10 */
    
    var integrityString = '[';
    
    var lastIndex = 0;
    
    for(i=0; i<approx; i++) {
        integrityString += '=';
        lastIndex = i;
    }
    
    for(i=lastIndex+1; i<10; i++) {
        integrityString += '-';
    }
    
    integrityString += ']';
    
    return integrityString + ' ' + this.health/this.maxHealth * 100 + '%';
}


// Transports pods between systems
function PodVessel(pods, system, id) {
    this.pods = pods;
    this.system = system;
    this.id = id;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.targetPlanet = null;
}
    
PodVessel.prototype.moveToSystem = function(system) {
    this.system = system;
}

PodVessel.prototype.getName = function() {
    return "Vessel " + this.id.toString();
}

PodVessel.prototype.getStatus = function() {
    return this.getName() + " standing by.";
}

PodVessel.prototype.getIntegrity = function() {
    var approx = roundToNearestTen(this.health)/10; /* To make it 0-10 */
    
    var integrityString = '[';
    
    var lastIndex = 0;
    
    for(i=0; i<approx; i++) {
        integrityString += '=';
        lastIndex = i;
    }
    
    for(i=lastIndex+1; i<10; i++) {
        integrityString += '-';
    }
    
    integrityString += ']';
    
    return integrityString + ' ' + this.health/this.maxHealth * 100 + '%';
}

PodVessel.prototype.getLocation = function() {
    if(this.targetPlanet == null) {
        return "Location: " + this.system.getName() + " System.";
    }
    
    return 'Location: Orbiting planet ' + this.targetPlanet.getName() + ' in ' + this.system.getName() + ' System.';
}

function Biome(name) { 
    this.name = name;
}

Biome.prototype.getName = function() {
    return this.name;
}

function roundToNearestTen(number) {
    return Math.round(number / 10) * 10;
}