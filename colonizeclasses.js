/*
Copyright 2015 Bilal Itani 

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
*/

// Colonizeable planet
function Planet(name, forces) {
    this.name = name;
    this.units = 0;
    this.forces = forces;
    this.biomes = [];
    this.pods = [];
    this.system = null;
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
function Pod (forces, id, vessel) {
    this.forces = forces;
    this.id = id;
    this.vessel = vessel;
    this.docked = true;
    this.planet = null;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.operational = true;
}

Pod.prototype.getName = function() {
    return "Pod " + this.id;
}

Pod.prototype.getLocation = function() {
    if(this.docked == true){
        return 'Docked on ' + this.vessel.getName() + '.';
    }
    else if(this.operational == true) {
        return 'Deployed on planet ' + this.planet.getName() + '.';
    }
    else
    {
        return 'Unknown.';   
    }
}

Pod.prototype.getIntegrity = function() {
    
    if(!this.operational) return this.getName() + ' is no longer operational.';  
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

Pod.prototype.launch = function(planet) {
    var chance = getRandomInt(0, 4)
    
    if(chance == 0)
    {
        this.destroy();
        
        return false
    }
    else
    {    
        this.planet = planet;
        
        planet.units += this.forces;        
        
        planet.pods.push(this);
        
        arrayRemove(this, this.vessel.pods);
        
        this.docked = false;
        
        return true;
    }   
    
}

Pod.prototype.takeDamage = function(number) {
    this.health -= number;
    
    if(this.health <= 0) {
        this.destroy();
    }
}

Pod.prototype.destroy = function() {
    
    // Remove hp
    this.health = 0
    
    // Remove it from the pod list
    //arrayRemove(this, podList);
    
    // No more forces in here.
    // Determine elsewhere before calling where the forces go
    this.forces = 0;
    
    //this.id = id;
    
    // Remove from vessel in case it was in one
    this.docked = false;
    
    // you're dead
    this.operational = false;
}

// Transports pods between systems
function PodVessel(pods, system, id) {
    this.pods = pods;
    this.system = system;
    this.id = id;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.targetPlanet = null;
    this.operational = true;
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
    if(this.operational == false) return this.name + " is no longer operational.";

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

PodVessel.prototype.orbit = function(planet) {
    this.targetPlanet = planet;
}

PodVessel.prototype.jump = function(system) {
    arrayRemove(this, this.system.vessels);
    this.system = system;
    system.vessels.push(this);
    this.targetPlanet = null;
}

PodVessel.prototype.takeDamage = function(number) {
    this.health -= number;
    
    if(this.health <= 0) {
        this.destroy();
    }
}

PodVessel.prototype.destroy = function() {
    
    // Remove hp
    this.health = 0
    
    // Pods are destroyed when a vessel containing them is destroyed
    for(var i = 0; i<this.pods.length; i++){
        this.pods[i].destroy();
    }

    //this.id = id;
    
    // Remove from vessel in case it was in one
    this.docked = false;
    this.targetPlanet = null;
    
    // you're dead
    this.operational = false;
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