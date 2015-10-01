// Colonizeable planet
function Planet(name, forces) {
    this.name = name;
    this.forces = forces;
}
    
Planet.prototype.getName = function() {
    return this.name;
}


// Solar system containing colonizable planets
function SolarSystem(name, planets) {
    this.name = name;
    this.planets = planets;
}

SolarSystem.prototype.getName = function() {
    return this.name;
}


// Used to colonize a planet
function Pod (forces, id){
    this.forces = forces;
    this.id = id;
}

Pod.prototype.getName = function() {
    return "Pod " + this.id;
}


// Transports pods between systems
function PodVessel(pods, system, id) {
    this.pods = pods;
    this.system = system;
    this.id = id;
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