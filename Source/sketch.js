function preload() {
  wordList = loadStrings("https://raw.githubusercontent.com/gonsie/wwfred/master/masterlist.txt");
  missingWords = loadStrings("missing-words.txt");
  testWordList = loadStrings("test.txt");
  extraWords = loadStrings("extra-words.txt");
  notWords = loadStrings("not-words.txt");
  
  // missingWords = [];
  // wordList = loadStrings("https://raw.githubusercontent.com/dwyl/english-words/master/words.txt");
}

function setup() {
  noCanvas();
  
  letterBank = "";
  extraTileBonus = 0;
  lastMillis = 0;
  lastIterations = 0;
  
  initElems();
  gui = new GUI();
  board = new WordBoard();
  loadBoard(15);
  board.loadPreset();
  solver = new WordFinder(board);
  loadWordList();
  
  // let out = [];
  // for (let word of extraWords) {
  //   if (!solver.isWord(word))
  //     out.push(word);
  // }
  // saveStrings(out, "new-words.txt");
}

function draw() {
  background(20);
  
  if (++lastIterations > 30) {
    let currentMillis = millis();
    let fpsElem = document.getElementById("fps");
    fpsElem.innerText = "FPS " + Math.floor(60 * 500 / (currentMillis - lastMillis));
    lastMillis = currentMillis;
    lastIterations = 0;
  }
}

/*



















*/
