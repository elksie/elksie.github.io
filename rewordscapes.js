/*Elisa Reed
Advanced Programming Topics
06/10/2024
Rewordscapes Script

Main code and behavior handling for rewordscapes website. contains all methods
to find, highlight, and fetch definitions/synonyms for words. controls behavior 
of html elements in rewordscapes.html.*/

//drop handler
function allowDrop(ev) {
    ev.preventDefault();
}

//drag handler, set data to be transfered
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.innerText);
    ev.dataTransfer.setData("color", ev.target.style.backgroundColor);
}

//drop handler, transfer data to grid square
function drop(ev) {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    ev.target.innerHTML = data;
    let color = ev.dataTransfer.getData("color");
    if (color == "") {
        //if blank set color to white
        ev.target.style.backgroundColor = "#FFFFFF";
    } else {
        //else clear color
        ev.target.style.backgroundColor = "";
    }
}

//Add a row to right of the grid
function growRow() {
    let grid = document.getElementById("puzzle");
    if (grid.rows.length < 50) {
        let newRow = grid.insertRow();
        for (let i = 0; i < grid.rows[0].cells.length; i++) {
            grid.rows[grid.rows.length-1].innerHTML += "<td id=\"" + [i] + ", " + 
            (grid.rows.length - 1) + "\"ondrop=\"drop(event)\"" + 
            "ondragover=\"allowDrop(event)\" onclick =" +  
            "\"findWordStart(event, this.id)\"></td>";
        }
    }
    
}

//Remove a row from the right of the grid
function shrinkRow() {
    let grid = document.getElementById("puzzle");
    grid.deleteRow(grid.rows.length - 1);
}

//add a column at the bottom of the grid
function growCol() {
    let grid = document.getElementById("puzzle").rows;
    if (grid[0].cells.length < 50) {
        for (let i = 0; i < grid.length; i++) {
            grid[i].innerHTML += "<td id=\"" + grid[i].cells.length + ", " + [i] +  
            "\"<td ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\"onclick =" + 
            "\"findWordStart(event, this.id)\"></td>";
        }
    }
    
}

//remove a column from the bottom of the grid
function shrinkCol() {
    let grid = document.getElementById("puzzle");
    for (let i = 0; i < grid.rows.length; i++) {
        grid.rows[i].deleteCell(grid.rows[i].cells.length-1);
    }
}

//use input and given dictionary to create list of permitted words
function handleFiles(wordLength, knownLetters, letterBank) {
    const bankChars = makeBank(letterBank); //make letter bank into map with keys and counts
    const output = document.getElementById('answers'); //outputted list
    let end = false; //initialize variable for invalid inputs
    let wordsPossible = [];

    //check for invalid inputs
    for (let i = 0; i < knownLetters.length; i++) {
        if (!letterBank.includes(knownLetters.charAt(i))) {
            //letter bank does not have a letter in the word
            end = true;
            break;
        }  
    }

    if (end || wordLength < 3 || wordLength > 7 || knownLetters.length != wordLength 
        || (letterBank.length > 8 && letterBank != 'abcdefghijklmnopqrstuvwxyz ')) {
        //input is not valid
        output.innerHTML = "Words that fit your description: <br> <li> Invalid Input!<br>";
    } else {
        //reset header on second run of code
        output.innerHTML = 'Words that fit your description:<br>';
        let options = { //set method to execute on fetch
            method:'GET',
        }
        fetch ("https://raw.githubusercontent.com/elksie/elksie.github.io/main/dictionary.txt", options) //wordscapes dictionary by gonzalezjo on github
            .then(res => res.blob())
            .then(res => {
                const reader = new FileReader();
                reader.readAsText(res); //reads dictionary as text

                //when dictonary is loaded do below
                reader.onload = function() { 
                    let allLines = reader.result.split(/\s+/); //split file by whitespace
                    let printed = false;
                    //parse through every line one by one
                    allLines.forEach((line) => { 
                        let print = true;
                        if (line.length == wordLength ) {
                            //word lengths match
                            //iterates through length of given word
                            for (let i = 0; i < wordLength; i++) { 
                                if (line.charAt(i) != knownLetters.charAt(i) && knownLetters.charAt(i) != ' ') { 
                                    //letter of line and knownLetters is not matching or blank
                                    print = false; 
                                    break;
                                }
                            }

                            let chars = makeBank(line);

                            //check for word having more of a letter than the letter bank
                            if (letterBank != 'abcdefghijklmnopqrstuvwxyz ') {
                                chars.forEach (function(value, key) {
                                    if (key != ' ') {
                                        if (value > bankChars.get(key) || !(String(letterBank).includes(key))) {
                                            print = false;
                     
                                        }
                                    }
                            
                                })
                            }

                            if (print) { 
                                //all requirements met
                                printed = true;
                                wordsPossible[wordsPossible.length] = line;
                            } 
                        }
                    })
                    let wordSelect = Math.floor(Math.random() * wordsPossible.length); //generate random number to select word
                    findHint(wordsPossible[wordSelect]); //find a hint for chosen word
                    if (!printed) {
                        //if no words found
                        output.innerHTML = "Words that fit your description: <br> <li> Invalid Input!<br>";
                    }
                }
            })
            .catch(err => {
                //log error to console in case of fetch error
                console.log(err);
            })
    }

}

//make letter bank with given string
function makeBank(line) {
    const chars = new Map();
    for (let i = 0; i < line.length; i++) {
        if (chars.has(line.charAt(i))) {
            //chars already has running count of that letter
            chars.set(line.charAt(i), chars.get(line.charAt(i)) + 1); //add one to count
        } else {
            //chars does not have that letter
            chars.set(line.charAt(i), 1); //make count one
        }
    }
    return chars;
}

function noHintFound() {
    const output = document.getElementById('answers'); //output field
    console.log("no hints found");
    output.innerHTML += "<li>No hints found.<br>";
}
    

//find hint for given word 'line'
function findHint(line) {
    console.log("finding hint");
    const output = document.getElementById('answers'); //output field
    const synonymBoolean = Number(document.getElementById('synonym').checked); //is synonym box checked
    const definitionBoolean = Number(document.getElementById('definition').checked); //is definition box checked
    
    let url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + line; //api from https://dictionaryapi.dev/ by meetDeveloper

    let options = { //set method to execue on fetch
        method:'GET',
    }

    //fetch dictionary json file for 'line'
    fetch(url, options)
        .then(res =>  res.json()) //parse result to json
        .then(data => {
            console.log(line);
            console.log("fetch success");
            let synString = "";
            let defString = "";
            console.log(data);
            //generate random number for part of speech
            let meaningsNum = data[0].meanings.length;         
            let ranMeaning = Math.floor(Math.random() * meaningsNum);

            //generate synonym string
            let length = data[0].meanings[ranMeaning].synonyms.length; //number of synonyms of word
            let ranNum = Math.floor(Math.random() * length); //random number between 0 and length - 1
            if (data[0].meanings[ranMeaning].synonyms[ranNum] != "undefined") {
                console.log(data[0].meanings[ranMeaning].synonyms[ranNum]);
                synString = "<li>" + data[0].meanings[ranMeaning].synonyms[ranNum] + "<br>";
            } else {
                synString = "<li>No synonyms found.<br>";
            }
            
            console.log(synString);
             
            //generate definition string
            let length2 = data[0].meanings[ranMeaning].definitions.length; //number of definitions of word
            let ranNum2 = Math.floor(Math.random() * length2); //random number between 0 and length - 1
            if (data[0].meanings[ranMeaning].definitions[ranNum].definition != "undefined") {
                console.log(data[0].meanings[ranMeaning].definitions[ranNum].definition);
                defString = "<li>" + data[0].meanings[ranMeaning].definitions[ranNum].definition + "<br>";
            } else {
                defString = "<li>No definitions found.<br>";
            }
            if(synonymBoolean && !definitionBoolean) { //synonym box checked
                output.innerHTML += synString;
            } else if (definitionBoolean && !synonymBoolean) { //definition box checked
                output.innerHTML += defString;
            } else { //both/no boxes checked
                let ranType = Math.floor(Math.random() * (2)); //generate random number
                if (ranType == 0) {
                    output.innerHTML += synString;
                } else {
                    output.innerHTML += defString;
                }
            }
            console.log(data);
        })
        .catch(err => {
            //error thrown by fetch
            alert(err)
        });  
}

//clear puzzle grid to all blank squares
function clearGrid() { 
    let tabRows = document.getElementById("puzzle").rows;
    for (let i = 0; i < tabRows.length; i++) {
        for (let j = 0; j < tabRows[0].cells.length; j++) {
            tabRows[i].cells[j].style.backgroundColor = "";
            tabRows[i].cells[j].innerHTML = null;
        }
    }
}

//clear previously highlighted boxes to prepare for next highlighting
function clearSelect() {
    let tabRows = document.getElementById("puzzle").rows;
    for (let i = 0; i < tabRows.length; i++) {
        for (let j = 0; j < tabRows[0].cells.length; j++) {
            if (!isEmpty(j, i) && tabRows[i].cells[j].style.backgroundColor != "rgb(255, 114, 118)") { 
                //check for text and background color
                tabRows[i].cells[j].style.backgroundColor = "#FFFFFF";
            } else {
                tabRows[i].cells[j].style.backgroundColor = "";
            }
        }
    }
}

//toggle variable for word highlighting
{
    var toggleXY = false;
}

//additional toggle variable for word highlighting
{
    var toggleXY2 = false;
}

//find starting Y coordinate for given click coord
function findStartY(x, y) {
    let start = false;
    for (let i = 1; i <= y + 1; i++) {
        start = (isEmpty(x, y - i));
        if (start) {
            return (y - i + 1);
        }
    }
}

//find starting X coordinate for given click coord
function findStartX(x, y) {
    let start = false;
    for (let i = 1; i <= x + 1; i++) {
        start = (isEmpty(x - i, y));
        if (start) {
            return (x - i + 1);
        }
    
    } 
}

//types a letter in the given square using user input asynchronously
async function typeLetter(x, y) {
    let tabRows = document.getElementById("puzzle").rows;
    tabRows[y].cells[x].style.backgroundColor = "#FF7276"; //highlight selected box red
            
    //call keypress function and do something with response
    keypress().then(function(response) { 
        let stay = true;
               
        if ('abcdefghijklmnopqrstuvwxyx '.includes(response.toLowerCase())) { 
            //if letter, type letter into box
            tabRows[y].cells[x].innerHTML = response.toUpperCase(); 
        } else if (response =="Backspace" || response == "Delete") {
            //if delete, delete letter
            tabRows[y].cells[x].innerHTML = "";
        } else if (response.includes("Arrow")) {
            //if arrow move from this box to a neighboring box
            stay = false;
            if (response == "ArrowLeft" && x - 1 >= 0) {
                typeLetter(Number(x) - 1, y);
            } else if (response == "ArrowRight" && Number(x) + 1 < tabRows[0].cells.length) {
                typeLetter(Number(x) + 1, y);
            } else if (response == "ArrowUp" && y - 1 >= 0) {
                typeLetter(x, Number(y) - 1);
            } else if ((response == "ArrowDown") && Number(y) + 1 < tabRows.length) {
                typeLetter(x, Number(y) + 1);
            } else {
                stay = true;
            }
        } else {
            //cancel keyboard menu
            stay = false;
        }

        //set background colors
        if (tabRows[y].cells[x].innerHTML == "") {
            //make background green (default)
            tabRows[y].cells[x].style.backgroundColor = "";
        } else {
            //make background white
            tabRows[y].cells[x].style.backgroundColor = "#FFFFFF";
        }

        if (stay) {   
            //stay on this box if stay is true          
            typeLetter(x, y);
        }
                
    }, function(error) {
        //log error to console in case of fetch error
        console.error("failed", error);
    })   
}

//listen for keypress and feed info to main method
function keypress() {
    return new Promise((res) => {
        document.addEventListener('keydown', onKeyHandler);
        function onKeyHandler(e) {
            e.preventDefault();
            document.removeEventListener('keydown', onKeyHandler);
            res(e.key);
        }
    })
}

//find start of a word from a click on a letter
function findWordStart(event, id) {
    console.log("finding word start");
    let tabRows = document.getElementById("puzzle").rows;
    let indices = id.split(", "); //x, y of square clicked in array
    let x = indices[0];
    let y = indices[1];

    clearSelect(); //clear previously highlighted boxes

    if (isEmpty(x, y)) {
        //if square is empty open typing menu
        typeLetter(x, y);
    } else {
        //find leftmost/uppermost x and y coordinate connected to clicked box
        let startY = findStartY(x, y);
        let startX = findStartX(x, y);

        let intersectX = Number(!isEmpty(Number(x) - 1, y) + !isEmpty(Number(x) + 1, y)); //# of squares to left/right filled
        let intersectY = Number(!isEmpty(x, Number(y) - 1) + !isEmpty(x, Number(y) + 1)); //# of squares to up/down filled
        let intersect = intersectX + intersectY; //total boxes filled

        if ((intersect == 2 && (intersectX != 2 && intersectY != 2)) || intersect >= 3) {
            //if more than one box checked (not in a row) toggle direction
            if (toggleXY2) {
                startY = y;
            } else {
                startX = x;
            }
            toggleXY2 = !toggleXY2;
        }

        let word = "";
        let wordType = findDirection(x, y, startX, startY, intersect); //find word direction

        if (wordType == 0) {
            //if vertical
            word = findWordY(startX, startY);
        } else {
            //if horizontal
            word = findWordX(startX, startY);
        }

        let letterBank = document.getElementById('letterBank').value + ' '; //store letter bank from input box
        if (letterBank == ' ') {
            //if none given, use entire alphabet
            letterBank = 'abcdefghijklmnopqrstuvwxyz ';
        }
        handleFiles(word.length, word.toLowerCase(), letterBank.toLowerCase()); //send word and letterBank to hint finder
    }
}

//find the direction of a word given the start coordinates and coordinate of original click
function findDirection(x, y, startX, startY, intersect) {
    console.log("finding direction");
    if (y!= startY) {
        //vertical case
        return 0;
    } else if (x != startX){
        //horizontal case
        return 1;
    } else if (intersect == 3) {
        //three boxes around start filled
        if (isEmpty(Number(startX) - 1, startY)) {
            //horizontal case
            return 1;
        } else {
            //vertical case
            return 0;
        }
    } else if (!isEmpty(Number(startX) + 1, startY) && !isEmpty(startX, Number(startY) + 1)) {
        //right and lower neighbors filled, pick a direction
        toggleXY = !toggleXY;
        return Number(toggleXY);
    } else if (isEmpty(Number(startX) + 1, startY)) {
        //right neighbor filled, vertical case
        return 0; 
    } else {
        //left neighbor filled, horizontal case
        return 1;
    } 
}

//find a word going in the X direction
function findWordX(x, y) {
    let tabRows = document.getElementById("puzzle").rows;
    if (isEmpty(x, y)) {
        //base case, box is empty
        return "";
    } else {
        //recursive case, box has letter
        if (tabRows[y].cells[x].innerHTML == "") {
            //add space for space box
            tabRows[y].cells[x].innerHTML = " ";
        }
        tabRows[y].cells[x].style.backgroundColor = "#FFFF9F" //highlight box yellow
        return tabRows[y].cells[x].innerHTML + findWordX(Number(x) + 1, y); //return letter in box plus letter in next box
    }
}

//find a word going in the Y direction
function findWordY(x, y) {
    let tabRows = document.getElementById("puzzle").rows;
    if (isEmpty(x, y)) {
        //base case, box is empty
        return "";
    } else {
        //recursive case, box has letter
        if (tabRows[y].cells[x].innerHTML == "") {
            //add space for space box
            tabRows[y].cells[x].innerHTML = " ";
        }
        tabRows[y].cells[x].style.backgroundColor = "#FFFF9F" //highlight box yellow
        return tabRows[y].cells[x].innerHTML + findWordY(x, Number(y) + 1); //return letter in box plus letter in next box
    }
}

//return whether the box is empty or not
function isEmpty(x, y) {
    let tabRows = document.getElementById("puzzle").rows;
    if (x == tabRows[0].cells.length || y == tabRows.length || x == -1 || y == -1) {
        //if x/y out of bounds, is empty
        return true;
    }
    return (tabRows[y].cells[x].style.backgroundColor == ""); //return whether background is blank or not
}
