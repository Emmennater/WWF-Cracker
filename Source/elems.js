
tileBonusSizes = {
  15: [
    [  "",  "",  "","TW",  "",  "","TL",  "","TL",  "",  "","TW",  "",  "",  ""],
    [  "",  "","DL",  "",  "","DW",  "",  "",  "","DW",  "",  "","DL",  "",  ""],
    [  "","DL",  "",  "","DL",  "",  "",  "",  "",  "","DL",  "",  "","DL",  ""],
    ["TW",  "",  "","TL",  "",  "",  "","DW",  "",  "",  "","TL",  "",  "","TW"],
    [  "",  "","DL",  "",  "",  "","DL",  "","DL",  "",  "",  "","DL",  "",  ""],
    [  "","DW",  "",  "",  "","TL",  "",  "",  "","TL",  "",  "",  "","DW",  ""],
    ["TL",  "",  "",  "","DL",  "",  "",  "",  "",  "","DL",  "",  "",  "","TL"],
    [  "",  "",  "","DW",  "",  "",  "",  "",  "",  "",  "","DW",  "",  "",  ""],
    ["TL",  "",  "",  "","DL",  "",  "",  "",  "",  "","DL",  "",  "",  "","TL"],
    [  "","DW",  "",  "",  "","TL",  "",  "",  "","TL",  "",  "",  "","DW",  ""],
    [  "",  "","DL",  "",  "",  "","DL",  "","DL",  "",  "",  "","DL",  "",  ""],
    ["TW",  "",  "","TL",  "",  "",  "","DW",  "",  "",  "","TL",  "",  "","TW"],
    [  "","DL",  "",  "","DL",  "",  "",  "",  "",  "","DL",  "",  "","DL",  ""],
    [  "",  "","DL",  "",  "","DW",  "",  "",  "","DW",  "",  "","DL",  "",  ""],
    [  "",  "",  "","TW",  "",  "","TL",  "","TL",  "",  "","TW",  "",  "",  ""]
  ],
  11: [
    ["TL",  "","TW",  "",  "",  "",  "",  "","TW",  "","TL"],
    [  "","DW",  "",  "",  "","DW",  "",  "",  "","DW",  ""],
    ["TW",  "","DL",  "","DL",  "","DL",  "","DL",  "","TW"],
    [  "",  "",  "","TL",  "",  "",  "","TL",  "",  "",  ""],
    [  "",  "","DL",  "",  "",  "",  "",  "","DL",  "",  ""],
    [  "","DW",  "",  "",  "",  "",  "",  "",  "","DW",  ""],
    [  "",  "","DL",  "",  "",  "",  "",  "","DL",  "",  ""],
    [  "",  "",  "","TL",  "",  "",  "","TL",  "",  "",  ""],
    ["TW",  "","DL",  "","DL",  "","DL",  "","DL",  "","TW"],
    [  "","DW",  "",  "",  "","DW",  "",  "",  "","DW",  ""],
    ["TL",  "","TW",  "",  "",  "",  "",  "","TW",  "","TL"]
  ]
}
tileBonuses = tileBonusSizes["15"];
hoveredTile = { tile: null, i:0, j:0 };
busy = 0;
rows = 0;
cols = 0;
isMobile = false;

function loadBoard(size) {
  if (size == rows && size == cols) return true;
  if (size % 2 == 0) return false;
  const bonuses = tileBonusSizes[size];
  if (!bonuses) return false;
  tileBonuses = bonuses;
  rows = size;
  cols = size;
  
  // Tile grid
  let tiles = document.getElementById("tiles");
  tiles.innerHTML = "";
  updateTileDims();

  for (let i = 0; i < rows; ++i) {
    for (let j = 0; j < cols; ++j) {
      let tile = document.createElement("tile");
      let tiletxt = document.createElement("tiletxt");
      let tilepre = document.createElement("tilepre");
      let tileval = document.createElement("tileval");
      let bonus = tileBonuses[i][j];
      
      // Bonus text
      if (bonus) {
        tile.classList.add(bonus.toLowerCase());
        tiletxt.innerText = bonus;
      }
      
      tileval.innerText = "";
      
      // Event listeners
      tile.addEventListener("mouseover", ()=>tileSelected(tile, i, j));
      tile.addEventListener("mouseout", ()=>{if (hoveredTile.tile == tile) hoveredTile.tile = null;});
      tile.addEventListener("mousedown", ()=>toggleWildcardTile(i, j));
      
      // Style
      tile.setAttribute("style", `
        font-size: calc(var(--scl) * 0.5px);
      `);
      tileval.setAttribute("style", `
        font-size: calc(var(--scl) * 0.25px);
        transform: translate(calc(var(--scl) * 0.34px), calc(var(--scl) * -0.34px));
      `);
      tilepre.setAttribute("style", `
        font-size: calc(var(--scl) * 0.7px);
      `);
      tilepre.style.display = "none";

      // Append children
      tile.append(tiletxt, tilepre, tileval);
      tiles.appendChild(tile);
    }
  }
  
  gui.reset();
  board.init(rows, cols);

  return true;
}

function initElems() {
  
  // Change HTML if user is on Mobile
  if (window.innerWidth / window.innerHeight < 0.8) {
    isMobile = true;
    let mobileContent = document.getElementById("mobile-content");
    mobileContent.style.display = "flex";

    // Load Mobile stylesheet
    let mobileLink = document.createElement("link");
    mobileLink.setAttribute("rel", "stylesheet");
    mobileLink.setAttribute("type", "text/css");
    mobileLink.setAttribute("href", "Style/style-mobile.css");
    document.body.appendChild(mobileLink);

    // Remove desktop content
    let desktopContent = document.getElementById("desktop-content");
    desktopContent.remove();
  } else {
    let desktopContent = document.getElementById("desktop-content");
    desktopContent.style.display = "flex";

    // Remove mobile content
    let mobileContent = document.getElementById("mobile-content");
    mobileContent.remove();
  }
  
  // Letter textbox
  let lettersElem = document.getElementById("letters");
  lettersElem.addEventListener("input", () => {
    letters = lettersElem.value.toLowerCase();
    if (letters.length > 7 || !isWordFormat(letters)) {
      lettersElem.classList.add("invalid");
    } else {
      lettersElem.classList.remove("invalid");
    }
  });
  lettersElem.addEventListener("focus", () => {
    ++busy;
  });
  lettersElem.addEventListener("focusout", () => {
    --busy;
  });
  
  // Solve button
  let solveButton = document.getElementById("solve");
  solveButton.setAttribute("disabled", "");
  solveButton.addEventListener("click", () => {
    if (!solver.loaded) return;
    
    // Clear previous plays
    gui.deselectCurrentPlay();
    gui.clearPlays();
    
    // Async function
    solver.solve(function callback(plays) {
      gui.loadPlays(plays);
    });
  });
  
  // Grid size
  let soloRadio = document.getElementById("solo");
  let duoRadio = document.getElementById("duo");
  duoRadio.click();
  soloRadio.addEventListener("click", () => {
    loadBoard(11);
  });
  duoRadio.addEventListener("click", () => {
    loadBoard(15);
  });
  
  // Clear button
  let clearButton = document.getElementById("clear-board");
  clearButton.addEventListener("click", () => {
    // Clear board
    board.clear();
    for (let i = 0; i < rows; ++i) {
      for (let j = 0; j < cols; ++j) {
        setTile("", i, j);
      }
    }
    
    // Clear plays
    gui.reset();
  });
  
  // Play word button
  let playButton = document.getElementById("play-word");
  playButton.addEventListener("click", () => {
    gui.playSelectedWord();
  });
  playButton.setAttribute("disabled", "");
}

function toggleExpandHowTo() {
  let elem = document.getElementById("how-to");
  elem.classList.toggle("expanded");
}

/// Tiles ///

function tileSelected(tile, i, j) {
  hoveredTile.tile = tile;
  hoveredTile.i = i;
  hoveredTile.j = j;
}

function setTile(letter, i, j) {
  let idx = i * rows + j;
  let tiles = document.getElementById("tiles");
  let tile = tiles.children[idx];
  if (!letter) {
    tile.children[0].innerText = tileBonuses[i][j];
    tile.children[2].innerText = "";
    tile.classList.remove("placed");
    
    // Decrease font size
    tile.setAttribute("style", `
      font-size: calc(var(--scl) * 0.5px);
    `);
  } else if (ALPHABET.indexOf(letter.toLowerCase()) != -1) {
    tile.children[0].innerText = letter.toUpperCase();
    tile.children[2].innerText = LETTER_VALUES[letter.toLowerCase()];
    tile.classList.add("placed");
    
    // Increase font size
    tile.setAttribute("style", `
      font-size: calc(var(--scl) * 0.7px);
    `);
  }
}

function markTile(i, j) {
  let idx = i * rows + j;
  let tiles = document.getElementById("tiles");
  let tile = tiles.children[idx];
  tile.classList.add("marked");
}

function unmarkTile(i, j) {
  let idx = i * rows + j;
  let tiles = document.getElementById("tiles");
  let tile = tiles.children[idx];
  tile.classList.remove("marked");
}

function toggleWildcardTile(i, j) {
  let idx = i * rows + j;
  let tiles = document.getElementById("tiles");
  let tile = tiles.children[idx];
  
  if (board.isWildcard(i, j)) {
    board.removeWildcard(i, j);
    tile.children[2].style.display = "block";
  } else if (board.getTile(i, j)) {
    board.setWildcard(i, j);
    tile.children[2].style.display = "none";
  }
}

function setTilePreview(letter, i, j, isWildcard = false) {
  // Get the tile
  let idx = i * rows + j;
  let tiles = document.getElementById("tiles");
  let tile = tiles.children[idx];
  
  if (letter) {
    // Set hint properties
    tile.classList.add("hint");
    tile.children[2].classList.add("hint");
    
    // Set the style
    tile.children[1].style.display = "flex";
    tile.children[1].innerText = letter;
    if (isWildcard)
      tile.children[2].innerText = "";
    else
      tile.children[2].innerText = LETTER_VALUES[letter.toLowerCase()];
  } else {
    // Remove hint properties
    tile.classList.remove("hint");
    tile.children[2].classList.remove("hint");
    
    // Set the style
    tile.children[1].style.display = "none";
    tile.children[2].classList.remove("hint");
    tile.children[2].innerText = "";
  }
}

function updateTileDims() {
  let tiles = document.getElementById("tiles");
  let bounds = tiles.getBoundingClientRect();
  let scl = Math.min(window.innerWidth, window.innerHeight * 0.5);
  let sz;
  
  if (isMobile) {
    sz = 1.0 * scl / cols - 2;
  } else {
    sz = 1.2 * scl / cols;
  }

  tiles.setAttribute("style", `
    grid-template-columns: repeat(${cols}, minmax(0, 1fr));
    grid-template-rows: repeat(${cols}, auto);
    --scl: ${sz};
  `);
}

/// Events ///

function loadingComplete() {
  let solveElem = document.getElementById("solve");
  solveElem.removeAttribute("disabled");
}

function keyPressed() {
  if (busy || !hoveredTile.tile) return;
  const { i, j } = hoveredTile;
  if (key == "Backspace") board.setTile("", i, j);
  else if (ALPHABET.indexOf(key.toLowerCase()) != -1)
    board.setTile(key.toLowerCase(), i, j);
}

function windowResized() {
  updateTileDims();
}

class GUI {
  constructor() {
    this.selectedPlay = { play: null, elem: null };
  }
  
  reset() {
    this.deselectCurrentPlay();
    this.clearPlays();
    
    // Clear letters
    let lettersElem = document.getElementById("letters");
    lettersElem.value = "";
  }
  
  clearPlays() {
    let playsElem = document.getElementById("plays");
    playsElem.innerHTML = "";
    
    // Disable play word button
    let playButton = document.getElementById("play-word");
    playButton.setAttribute("disabled", "");
  }
  
  loadPlays(plays) {
    // No plays
    if (plays.length == 0) return;
    
    let playList = document.getElementById("plays");
    
    for (let play of plays) {
      let playElem = document.createElement("play");
      let pointsElem = document.createElement("div");
      playElem.innerHTML = play.word;
      pointsElem.innerHTML = play.points;
      pointsElem.classList.add("align-right");
      
      // Add click event listener
      playElem.addEventListener("click", () => {
        this.selectPlay(play, playElem);
      });
      
      // Add points to play element
      playElem.appendChild(pointsElem);
      
      // Add play to sidebar
      playList.appendChild(playElem);
    }
    
    // Select the first one automatically
    if (this.selectedPlay.play == null)
      playList.children[0].click();
    
    // Enable play word button
    let playButton = document.getElementById("play-word");
    playButton.removeAttribute("disabled");
  }
  
  deselectCurrentPlay() {
    // Remove old selection
    if (this.selectedPlay.elem == null) return;
    this.selectedPlay.elem.classList.remove("selected");
    
    // Word and direction
    const { word, i, j, dir } = this.selectedPlay.play;
    let di = dir == "v";
    let dj = dir == "h";
    for (let k = 0; k < word.length; ++k) {
      let I = i + di * k;
      let J = j + dj * k;
      
      // Out of bounds
      if (I >= rows || J >= cols) continue;

      // Skip if this letter has already been played
      if (board.getTile(I, J)) continue;
      
      // Remove tile preview
      setTilePreview("", I, J);
    }
    
    this.selectedPlay.play = null;
    this.selectedPlay.elem = null;
  }
  
  selectPlay(play, elem) {
    this.deselectCurrentPlay();
    
    // Set new selection
    this.selectedPlay.play = play;
    this.selectedPlay.elem = elem;
    elem.classList.add("selected");
    
    // Word and direction
    const { word, i, j, dir, wildcardLocations } = this.selectedPlay.play;
    let di = dir == "v";
    let dj = dir == "h";

    for (let k = 0; k < word.length; ++k) {
      let I = i + di * k;
      let J = j + dj * k;
      
      // Skip if this letter has already been played
      if (board.getTile(I, J)) continue;
      
      // Check if it is a wildcard
      let isWildcard = false;
      for (let loc of wildcardLocations) {
        if (loc == k) {
          isWildcard = true;
          break;
        }
      }
      
      // Set tile preview
      setTilePreview(word[k], I, J, isWildcard);
    }
  }
  
  playSelectedWord() {
    // No word selected
    if (this.selectedPlay.play == null) return;
    
    // Word and direction
    const { word, i, j, dir, wildcards } = this.selectedPlay.play;
    let di = dir == "v";
    let dj = dir == "h";
    
    // Remove preview
    this.deselectCurrentPlay();
    
    // Play word
    for (let k = 0; k < word.length; ++k) {
      let I = i + di * k;
      let J = j + dj * k;
      
      // Skip if this letter has already been played
      if (board.getTile(I, J)) continue;
      
      // Check if it is a wildcard
      let isWildcard = false;
      for (let wildcard of wildcards) {
        if (wildcard.i == I && wildcard.j == J) {
          isWildcard = true;
          break;
        }
      }
      
      // Set the tile and wildcard state
      board.setTile(word[k], I, J);
      if (isWildcard && !board.isWildcard(I, J))
        toggleWildcardTile(I, J);
    }
    
    this.reset();
  }
}

/*




















*/
