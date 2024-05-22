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
        ev.target.style.backgroundColor = "#FFFFFF";
    } else {
        ev.target.style.backgroundColor = "";
    }
}

//Add a row to right of the grid
function growRow() {
    let x = document.getElementById("puzzle");
    let newRow = x.insertRow();
    for (let i = 0; i < x.rows[0].cells.length; i++) {
        x.rows[x.rows.length-1].innerHTML += "<td id=\"" + [i] + ", " + (x.rows.length - 1) + "\"ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\" onclick = \"findWordStart(event, this.id)\"></td>";
    }
}

//Remove a row from the right of the grid
function shrinkRow() {
    let x = document.getElementById("puzzle");
    x.deleteRow(x.rows.length - 1);
}

//add a column at the bottom of the grid
function growCol() {
    let x = document.getElementById("puzzle").rows;
    for (let i = 0; i < x.length; i++) {
        x[i].innerHTML += "<td id=\"" + x[i].cells.length + ", " + [i] +  "\"<td ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\"onclick = \"findWordStart(event, this.id)\"></td>";
    }
}

//remove a column from the bottom of the grid
function shrinkCol() {
    let x = document.getElementById("puzzle");
    for (let i = 0; i < x.rows.length; i++) {
        x.rows[i].deleteCell(x.rows[i].cells.length-1);
    }
}

//test function to test values in a map
function mapPrint(value, key, map) {
    console.log(key + " = " + value);
}

//use input and given dictionary to create list of permitted words
function handleFiles(wordLength, knownLetters, letterBank) {
    const bankChars = makeBank(letterBank); //make letter bank into map with keys and counts
    const file = document.getElementById('input'); //dictionary file
    const output = document.getElementById('answers'); //outputted list
    let end = false; //initialize variable for invalid inputs
    let wordsPossible = [];

    //check for invalid inputs
    for (let i = 0; i < knownLetters.length; i++) {
        if (!letterBank.includes(knownLetters.charAt(i))) {
            //letter bank does not have a letter in the word
            console.log('bank 1 check');
            end = true;
            break;
        }
        
    }

    if (end || wordLength < 3 || wordLength > 7 || knownLetters.length != wordLength || (letterBank.length > 8 && letterBank != 'abcdefghijklmnopqrstuvwxyz ')) {
        //input is not valid
        console.log('input check');
        output.innerHTML = "Words that fit your description: <br> <li> Invalid Input!<br>";
    } else {
        //reset header on second run of code
        output.innerHTML = 'Words that fit your description:<br>';
        let options = { //set method to execue on fetch
            method:'GET',
        }
        fetch ("https://raw.githubusercontent.com/elksie/elksie.github.io/main/dictionary.txt", options)
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
                                    console.log("letter check")
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
                    let wordSelect = Math.floor(Math.random() * wordsPossible.length);
                    console.log(wordsPossible);
                    console.log(wordsPossible[wordSelect]);
                    findHint(wordsPossible[wordSelect]);
                    if (!printed) {
                        console.log("print check")
                        output.innerHTML = "Words that fit your description: <br> <li> Invalid Input!<br>";
                    }
                }
            })
            .catch(err => {
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

//find hint for given word 'line'
function findHint(line) {
    
    const output = document.getElementById('answers'); //output field
    const synonymBoolean = document.getElementById('synonym').checked; //is synonym box checked
    const definitionBoolean = document.getElementById('definition').checked; //is definition box checked
    
    let url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + line; //url for api fetch

    let options = { //set method to execue on fetch
        method:'GET',
    }

    //fetch dictionary json file for 'line'
    fetch(url, options)
        .then(res =>  res.json()) //parse result to json
        .then(data => {
            let synString = "";
            let defString = "";
            
            //only synonym box checked
            let meaningsNum = data[0].meanings.length;
            let ranMeaning = Math.floor(Math.random() * meaningsNum);
            let length = data[0].meanings[ranMeaning].synonyms.length; //number of synonyms of word
            let ranNum = Math.floor(Math.random() * length); //random number between 0 and length - 1
            if (data[0].meanings[ranMeaning].synonyms[ranNum] != undefined) {
                synString= "<li>" + data[0].meanings[ranMeaning].synonyms[ranNum] + "<br>"; //print random synonym
            }       
             
            //only definition box checked
            let length2 = data[0].meanings[ranMeaning].definitions.length; //number of definitions of word
            let ranNum2 = Math.floor(Math.random() * length2); //random number between 0 and length - 1
            
            if (data[0].meanings[ranMeaning].definitions[ranNum2] != undefined) {
                defString= "<li>" + data[0].meanings[ranMeaning].definitions[ranNum2].definition + "<br>"; //print random definition
            }

            if (synonymBoolean) {
                defString = "";
            } else if (definitionBoolean) {
                synString = "";
            }
            console.log("Boxes Checked: " + Number(synonymBoolean) + Number(definitionBoolean));

            if (synonymBoolean + definitionBoolean == 1) {
                //one box is checked
                output.innerHTML += synString + defString;
            } else {
                if (length == 0) {
                    output.innerHTML += defString;
                } else if (length2 == 0) {
                    output.innerHTML += synString;
                } else {
                    let ranType = Math.floor(Math.random() * (2)); //generate random number
                    if (ranType == 0) {
                        output.innerHTML += synString;
                    } else {
                        output.innerHTML += defString;
                    }
                }
                
            }

            console.log(data);
        })
        .catch(err => {
            //error thrown by fetch
            alert(err)
        });  
}

function clearGrid() {
    let tabRows = document.getElementById("puzzle").rows;
    for (let i = 0; i < tabRows.length; i++) {
        for (let j = 0; j < tabRows[0].cells.length; j++) {
            tabRows[i].cells[j].style.backgroundColor = "";
            tabRows[i].cells[j].innerHTML = null;
        }
    }
}

function clearSelect() {
    let tabRows = document.getElementById("puzzle").rows;
    for (let i = 0; i < tabRows.length; i++) {
        for (let j = 0; j < tabRows[0].cells.length; j++) {
            console.log(tabRows[i].cells[j].style.backgroundColor);
            if (!isEmpty(j, i) && tabRows[i].cells[j].style.backgroundColor != "rgb(255, 114, 118)") {
                tabRows[i].cells[j].style.backgroundColor = "#FFFFFF";
            } else {
                tabRows[i].cells[j].style.backgroundColor = "";
            }
        }
    }
}

{
    var toggleXY = false;
}

{
    var toggleXY2 = false;
}

function findStartY(x, y) {
    let start = false;
    for (let i = 1; i <= y + 1; i++) {
        start = (isEmpty(x, y - i));
        if (start) {
            return (y - i + 1);
        }
    }
}

function findStartX(x, y) {
    let start = false;
    for (let i = 1; i <= x + 1; i++) {
        start = (isEmpty(x - i, y));
        if (start) {
            return (x - i + 1);
        }
    
    } 
}

async function typeLetter(x, y) {
    
        let tabRows = document.getElementById("puzzle").rows;
            tabRows[y].cells[x].style.backgroundColor = "#FF7276";
        
            keypress().then(function(response) {
                console.log("here");
                console.log(response);
                let stay = true;
            
                if ('abcdefghijklmnopqrstuvwxyx '.includes(response.toLowerCase()) && tabRows[y].cells[x].style.backgroundColor == "rgb(255, 114, 118)") {
                    tabRows[y].cells[x].innerHTML = response.toUpperCase();
                } else if (response =="Backspace" || response == "Delete") {
                    tabRows[y].cells[x].innerHTML = "";
                } else if (response.includes("Arrow")) {
                    stay = false;
                    if (response == "ArrowLeft" && x - 1 >= 0) {
                        typeLetter(Number(x) - 1, y);
                    } else if (response == "ArrowRight" && Number(x) + 1 < tabRows[0].cells.length) {
                        typeLetter(Number(x) + 1, y);
                    } else if (response == "ArrowUp" && y - 1 >= 0) {
                        typeLetter(x, Number(y) - 1);
                    } else if ((response == "ArrowDown")&& Number(y) + 1 < tabRows.length) {
                        typeLetter(x, Number(y) + 1);
                    } else {
                        stay = true;
                    }
                } else {
                    stay = false;
                }
                if (tabRows[y].cells[x].innerHTML == "") {
                    tabRows[y].cells[x].style.backgroundColor = "";
                } else if (response == " "){
                    tabRows[y].cells[x].style.backgroundColor = "#FFFFFF";
                } else {
                    tabRows[y].cells[x].style.backgroundColor = "#FFFFFF";
                }

                if (stay) {             
                    typeLetter(x, y);
                }
            
            }, function(error) {
                console.error("failed", error);
            })

        
}

{
    var squareClicked = false;
}

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

function findWordStart(event, id) {
    let tabRows = document.getElementById("puzzle").rows;
    let indices = id.split(", ");
    let x = indices[0];
    let y = indices[1];

    clearSelect();

    if (isEmpty(x, y)) {
        for (let i = 0; i < tabRows.length; i++) {
            for (let j = 0; j < tabRows[0].cells.length; j++) {
                if (tabRows[i].cells[j].style.backgroundColor == "#FFFFFF") {
                    tabRows[i].cells[j].style.backgroundColor = '#bfd1b0';
                }
            }
        }

        typeLetter(x, y);
    } else {
        let startY = findStartY(x, y);
        let startX = findStartX(x, y);

        let intersectX = Number(!isEmpty(Number(x) - 1, y) + !isEmpty(Number(x) + 1, y));
        let intersectY = Number(!isEmpty(x, Number(y) - 1) + !isEmpty(x, Number(y) + 1));
        let intersect = intersectX + intersectY;
        if ((intersect == 2 && (intersectX != 2 && intersectY != 2)) || intersect == 3) {
            if (toggleXY2) {
                startY = y;
            } else {
                startX = x;
            }
            toggleXY2 = !toggleXY2;
        }

        let word = "";
        let wordType = 0;

        wordType = findDirection(x, y, startX, startY, intersect);

        if (wordType == 0) {
            word = findWordY(startX, startY);
        } else {
            word = findWordX(startX, startY);
        }

        let letterBank = document.getElementById('letterBank').value + ' ';
        if (letterBank == ' ') {
            letterBank = 'abcdefghijklmnopqrstuvwxyz ';
        }
        
        console.log(word.length + ", " + word + ", " + letterBank);
        handleFiles(word.length, word.toLowerCase(), letterBank.toLowerCase());
    }
}

function findDirection(x, y, startX, startY, intersect) {

    if (y!= startY) {
        return 0;
    } else if (x != startX){
        return 1;
    } else if (intersect == 3) {
        if (isEmpty(Number(startX) - 1, startY)) {
            return 1;
        } else {
            return 0;
        }
    } else if (!isEmpty(Number(startX) + 1, startY) && !isEmpty(startX, Number(startY) + 1)) {
        toggleXY = !toggleXY;
        return Number(toggleXY);
    } else if (isEmpty(Number(startX) + 1, startY)) {
        return 0; 
    } else {
        return 1;
    }
        
    
    
}

function findWordX(x, y) {
    let tabRows = document.getElementById("puzzle").rows;
    console.log("findWordX " + x + ", " + y);
    if (isEmpty(x, y)) {
        return "";
    } else {
        if (tabRows[y].cells[x].innerHTML == "") {
            tabRows[y].cells[x].innerHTML = " ";
        }
        tabRows[y].cells[x].style.backgroundColor = "#FFFF9F"
        return tabRows[y].cells[x].innerHTML + findWordX(Number(x) + 1, y);
    }
}

function findWordY(x, y) {
    let tabRows = document.getElementById("puzzle").rows;
    console.log("findWordY " + x + ", " + y);
    if (isEmpty(x, y)) {
        return "";
    } else {
        if (tabRows[y].cells[x].innerHTML == "") {
            tabRows[y].cells[x].innerHTML = " ";
        }
        tabRows[y].cells[x].style.backgroundColor = "#FFFF9F"
        return tabRows[y].cells[x].innerHTML + findWordY(x, Number(y) + 1);
    }
}


function isEmpty(x, y) {
    let tabRows = document.getElementById("puzzle").rows;
    if (x == tabRows[0].cells.length || y == tabRows.length || x == -1 || y == -1) {
        return true;
    }
    return (tabRows[y].cells[x].style.backgroundColor == "");
}