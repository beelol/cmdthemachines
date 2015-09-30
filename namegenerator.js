
// This script provides tools to generate a name for celestial bodies.

var letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

var vowels = ["a", "e", "i", "o", "u", "y"];

var consonants = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "z"];

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isConsonant(c) {

    if(consonants.indexOf(c.toString()) > -1) return true;
    
    return false;
}

function nextLetter(c) {
    
    if (isConsonant(c)) {
        letter = vowels[getRandomInt(0, vowels.length-1)];
    } else {
        letter = consonants[getRandomInt(0, consonants.length-1)];
    }

    return letter;
}

function generateName() {
    var i = 0, letterIndex = getRandomInt(0, letters.length-1),
        letter = letters[letterIndex], wordLength = getRandomInt(4, 8-1),
        word = [letter], newWord = "";
    
    for (i = 1; i < wordLength; i++) {
        console.log(word[i - 1]);
        letter = nextLetter(word[i - 1]);
        
        word += letter;
    }

    // Capitalize first letter
    newWord += word[0].toString().toUpperCase();
    
    // Add the rest
    for (i = 1; i < word.length; i++) {
        newWord += word[i];
    }
    
    return newWord;
}        
