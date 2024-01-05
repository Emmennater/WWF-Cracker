const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const LETTER_VALUES = {
  a: 1,
  b: 4,
  c: 4,
  d: 2,
  e: 1,
  f: 4,
  g: 3,
  h: 3,
  i: 1,
  j: 10,
  k: 5,
  l: 2,
  m: 4,
  n: 2,
  o: 1,
  p: 4,
  q: 10,
  r: 1,
  s: 1,
  t: 1,
  u: 2,
  v: 5,
  w: 4,
  x: 8,
  y: 3,
  z: 10,
  '?': 0 // Blank Tile
};

class WordFinder {
  constructor(board) {
    this.board = board;
    this.loaded = false;
    this.wordList = null;
    this.wordTree = null;
    this.rwordTree = null;
    this.patterns = new Map();
    this.plays = [];
  }
  
  /// Procomputation ///
  
  async loadWordList(data) {    
    this.wordList = data.filter(v => wordFilter(v)).sort();
    await this.buildWordTree();
    await this.generatePatternMaps();
    this.loaded = true;
    loadingComplete();
    // this.solve();
  }
  
  async buildWordTree() {
    this.wordTree = {};
    this.rwordTree = {};
    
    // Control flow to allow javascript time to catch up
    const BREAK_ITERATIONS = 5000;
    const BREAK_DELAY = 5; // ms
    let iterations = 0;
    
    // Generating trees
    for (let word of this.wordList) {
      
      // Pausing every now and then
      if (++iterations > BREAK_ITERATIONS) {
        iterations = 0;
        await sleep(BREAK_DELAY);
      }
      
      let tree1 = this.wordTree;
      for (let i = 0; i < word.length; ++i) {
        const c = word[i];
        if (!tree1[c]) tree1[c] = {};
        tree1 = tree1[c];
      }
      let tree2 = this.rwordTree;
      for (let i = word.length - 1; i >= 0; --i) {
        const c = word[i];
        if (!tree2[c]) tree2[c] = {};
        tree2 = tree2[c];
      }
      tree1.word = true;
      tree2.word = true;
    }
  }
  
  async generatePatternMaps() {
    // Control flow to allow javascript time to catch up.
    const BREAK_ITERATIONS = 5000;
    const BREAK_DELAY = 5; // ms
    let iterations = 0;
    
    // Generate all possible substrings of at least 2 letters
    // in length of every word and add them to the pattern
    // dictionary.
    for (let word of this.wordList) {
      // Pausing every now and then
      if (++iterations > BREAK_ITERATIONS) {
        iterations = 0;
        await sleep(BREAK_DELAY);
      }
      
      for (let i = 0; i <= word.length - 1; ++i) {
        for (let j = i + 1; j <= word.length; ++j) {
          let substr = word.substring(i, j);
          let pattern = this.patterns.get(substr);
          if (!pattern) this.patterns.set(substr, [{ word, i }]);
          else pattern.push({ word, i });
        }
      }
    }
  }
  
  /// Solving ///
  
  findWords(letters, fullLength = false) {
    let found = {};
    function findWords(letters, node, current) {
      if (!node) return;
      if (node.word && (!fullLength || current.length == letters.length))
        found[current] = true;
      for (let i = 0; i < letters.length; ++i) {
        let c = letters[i];
        
        if (c == "?") {
          // Wildcards
          for (let j = 0; j < ALPHABET.length; ++j) {
            c = ALPHABET[j];
            const child = node[c];
            letters[i] = "";
            const words = findWords(letters, child, current + c);
            letters[i] = "?";
          }
        } else {
          // Single letter
          const child = node[c];
          letters[i] = "";
          const words = findWords(letters, child, current + c);
          letters[i] = c;
        }
      }
      return found;
    }
    
    findWords(letters.split(""), this.wordTree, "");
    let words = Object.keys(found).sort();
    return words.sort((a,b) => b.length - a.length);
  }
  
  startsWith(letters, startingLetters) {
    const words = this.findWords(letters + startingLetters);
    const regex = new RegExp("^" + startingLetters, "g");
    return words.filter(word => word.match(regex));
  }
  
  endsWith(letters, endingLetters) {
    const words = this.findWords(letters + endingLetters);
    const regex = new RegExp(endingLetters + "$", "g");
    return words.filter(word => word.match(regex));
  }
  
  existsLetters(letters) {
    return this.patterns.get(letters);
  }
  
  isWord(word) {
    let tree = this.wordTree;
    for (let i = 0; i < word.length; ++i) {
      const c = word[i];
      tree = tree[c];
      if (!tree) return false;
    }
    return tree.word;
  }
  
  searchPhrase(phrase) {
    let node = this.wordTree;
    for (let c of phrase) {
      node = node[c];
      if (!node) return false;
    }
    return node;
  }
  
  findWord(word) {
    let letters = this.searchPhrase(word);
    return letters.word ? true : false;
  }
  
  isOccupied(i, j) {
    return this.board.getTile(i, j) ? true : false;
  }
  
  hasNeighbor(i, j) {
    // Check for nearby letter
    if (i > 0  && this.board.getTile(i - 1, j)) return true;
    if (i < rows - 1 && this.board.getTile(i + 1, j)) return true;
    if (j > 0  && this.board.getTile(i, j - 1)) return true;
    if (j < cols - 1 && this.board.getTile(i, j + 1)) return true;
    return false;
  }
  
  getNeighborSubstrings(i, j) {
    let dir = { up: "", down: "", left: "", right: "" };
    let letter;
    
    // Up
    for (let r = i - 1; r >= 0; --r) {
      let letter = this.board.getTile(r, j);
      if (!letter) break;
      dir.up = letter + dir.up;
    }
    
    // Down
    for (let r = i + 1; r < rows; ++r) {
      let letter = this.board.getTile(r, j);
      if (!letter) break;
      dir.down += letter;
    }
    
    // Left
    for (let c = j - 1; c >= 0; --c) {
      let letter = this.board.getTile(i, c);
      if (!letter) break;
      dir.left = letter + dir.left;
    }
    
    // Right
    for (let c = j + 1; c < cols; ++c) {
      let letter = this.board.getTile(i, c);
      if (!letter) break;
      dir.right += letter;
    }
    
    return dir;
  }
  
  async findAllWords() {
    let allPlays = [];
    let placementsFound = 0;
    
    // Scan until a valid placement is found
    for (let i = 0; i < rows; ++i) {
      for (let j = 0; j < cols; ++j) {
        if (this.isOccupied(i, j)) continue;
        if (!this.hasNeighbor(i, j)) continue;
        ++placementsFound;
        
        // Valid placement found
        let words = [];
        await this.findWordsAt(i, j, words);
        
        allPlays.push(...words);
      }
    }
    
    // Starting position
    if (placementsFound == 0) {
      let words = [];
      await this.findWordsAt(Math.floor(rows / 2), Math.floor(cols / 2), words);
      allPlays.push(...words);
    }
    
    return removeDuplicates(allPlays, "word", "i", "j", "dir");
  }
  
  validateVertcalPlay(word, i, j) {
    // i and j is the position of the start of the word.
    
    // Check out of bounds
    if (i < 0 || i + word.length > rows) return false;
    
    // Make sure there are no letters before or after the word
    if (i > 0 && this.board.getTile(i - 1, j)) return false;
    if (i + word.length < rows && this.board.getTile(i + word.length, j)) return false;
    
    // Letter bank
    let availableLetters = {};
    let wildcards = [];
    for (let letter of this.board.letters) {
      let occurences = availableLetters[letter];
      if (occurences == undefined)
        availableLetters[letter] = 1;
      else
        ++availableLetters[letter];
    }
    
    // Check for valid word play
    for (let k = 0; k < word.length; ++k) {
      const ch = word[k];
      
      // Get current tile letter
      let r = i + k;
      let letter = this.board.getTile(r, j);
      
      // Check letters that were already placed
      if (letter) {
        if (letter != word[k]) return false;
        else continue;
      } else {
        // Letter is used up
        if (!availableLetters[ch]) {
          if (availableLetters["?"]) {
            --availableLetters["?"];
            wildcards.push(ch);
          } else return false;
        } else {
          --availableLetters[ch];
        }
      }
      
      let left = "";
      let right = "";

      // Left
      for (let c = j - 1; c >= 0; --c) {
        let letter = this.board.getTile(r, c);
        if (!letter) break;
        left = letter + left;
      }

      // Right
      for (let c = j + 1; c < cols; ++c) {
        let letter = this.board.getTile(r, c);
        if (!letter) break;
        right += letter;
      }
      
      // Full horizontal word
      let horzWord = left + ch + right;
      
      // Skip check if ony 1 letter
      if (horzWord.length == 1) continue;
      
      // Validate word
      if (!this.isWord(horzWord)) return false;
    }
    
    // Valid play
    return wildcards;
  }
  
  validateHorizontalPlay(word, i, j) {
    // i and j is the position of the start of the word.
    
    // Check out of bounds
    if (j < 0 || j + word.length > cols) return false;
    
    // Make sure there are no letters before or after the word
    if (j > 0 && this.board.getTile(i, j - 1)) return false;
    if (j + word.length < cols && this.board.getTile(i, j + word.length)) return false;
    
    // Letter bank
    let availableLetters = {};
    let wildcards = [];
    for (let letter of this.board.letters) {
      let occurences = availableLetters[letter];
      if (occurences == undefined)
        availableLetters[letter] = 1;
      else
        ++availableLetters[letter];
    }
    
    for (let k = 0; k < word.length; ++k) {
      const ch = word[k];
      
      // Get current tile letter
      let c = j + k;
      let letter = this.board.getTile(i, c);
      
      // Check letters that were already placed
      if (letter) {
        if (letter != word[k]) return false;
        else continue;
      } else {
        // Letter is used up
        if (!availableLetters[ch]) {
          if (availableLetters["?"]) {
            --availableLetters["?"];
            wildcards.push(ch);
          } else return false;
        } else {
          --availableLetters[ch];
        }
      }
      
      let down = "";
      let up = "";

      // Up
      for (let r = i - 1; r >= 0; --r) {
        let letter = this.board.getTile(r, c);
        if (!letter) break;
        up = letter + up;
      }

      // Down
      for (let r = i + 1; r < rows; ++r) {
        let letter = this.board.getTile(r, c);
        if (!letter) break;
        down += letter;
      }
      
      // Full horizontal word
      let vertWord = up + ch + down;
      
      // Skip check if ony 1 letter
      if (vertWord.length == 1) continue;
      
      // Validate word
      if (!this.isWord(vertWord)) return false;
    }
    
    // Valid play
    return wildcards;
  }
  
  async findWordsAt(i, j, words) {
    // markTile(i, j);
    
    // Get letters from each direction
    let dir = this.getNeighborSubstrings(i, j);
    
    // Control flow to allow javascript time to catch up.
    const BREAK_ITERATIONS = 10000;
    const BREAK_DELAY = 5; // ms
    let iterations = 0;
    
    for (let _letter of this.board.letters) {
      let letters = _letter == "?" ? ALPHABET : _letter;
      for (let letter of letters) {
        // Check the letters so far...
        let vert = dir.up + letter + dir.down;
        let horz = dir.left + letter + dir.right;

        // Single letters are ignored.
        let vertMatches = this.existsLetters(vert);
        let horzMatches = this.existsLetters(horz);
        if ((vert.length != 1 && vertMatches == undefined) ||
            (horz.length != 1 && horzMatches == undefined)) continue;

        // If up / down is more than 1 letter and isn't
        // a word, then we cant go left / right
        let canGoHorizontal = (vert.length == 1 || this.isWord(vert));
        let canGoVertical = (horz.length == 1 || this.isWord(horz));

        // From here we can either:
        // 1. Check each word that works with these letters.
        // 2. Place one letter at a time, going through all
        //    combinations with valid letter placements. (faster)

        // Virtical words
        if (canGoVertical && vertMatches) {
          for (let fit of vertMatches) {
            
            // Pausing every now and then
            // if (++iterations > BREAK_ITERATIONS) {
            //   iterations = 0;
            //   await sleep(BREAK_DELAY);
            // }
            
            if (fit.word.length < vert.length) continue;
            let I = i - fit.i - dir.up.length;
            if (fit.word.length == vert.length) {
              let wildcards = _letter == "?" ? [letter] : [];
              words.push({ word:fit.word, i:I, j:j, dir:"v", wildcards }); 
            } else {
              let wildcards = this.validateVertcalPlay(fit.word, I, j)
              if (wildcards) {
                words.push({ word:fit.word, i:I, j:j, dir:"v", wildcards });
              }
            }
          }
        }

        // Horizontal words
        if (canGoHorizontal && horzMatches) {
          for (let fit of horzMatches) {
            
            // Pausing every now and then
            // if (++iterations > BREAK_ITERATIONS) {
            //   iterations = 0;
            //   await sleep(BREAK_DELAY);
            // }
            
            if (fit.word.length < horz.length) continue;
            let J = j - fit.i - dir.left.length;
            if (fit.word.length == horz.length) {
              let wildcards = _letter == "?" ? [letter] : [];
              words.push({ word:fit.word, i:i, j:J, dir: "h", wildcards });
            } else {
              let wildcards = this.validateHorizontalPlay(fit.word, i, J);
              if (wildcards) {
                words.push({ word:fit.word, i:i, j:J, dir: "h", wildcards });
              }
            }
          }
        }
      }
    }
  }
  
  async solve(callback) {
    if (!this.loaded) return false;
    
    // Solve game
    this.board.updateLetters();
    this.plays = await this.findAllWords();
    this.scorePlays();
    callback(this.plays);
    
    return true;
  }
  
  /// Scoring ///
  
  scorePlays() {
    // Calculate the score of each play
    for (let play of this.plays) {
      let multiplier = 1;
      let totalPoints = 0;
      let totalBonusPoints = 0;
      let lettersUsed = 0;
      let { word, i, j, dir, wildcards } = play;
      
      let letterPoints = Array(word.length).fill(0);
      let letterBonusPoints = Array(word.length).fill(0);
      
      if (dir == "h") {
        // Horizontal play
        for (let k = 0; k < word.length; ++k) {
          let letter = word[k];
          let value = LETTER_VALUES[letter];
          let bonus = tileBonuses[i][j + k];
          
          // If the tile is already played then just add the value
          if (this.board.getTile(i, j + k)) {
            if (!this.board.isWildcard(i, j + k))
              totalPoints += value;
            continue;
          } else {
            // Played tile bonus
            // value += LETTER_BONUS[letter];
          }
          
          ++lettersUsed;
          
          let currentMultiplier = 1;
          switch (bonus) {
            case "DL": value *= 2; break;
            case "TL": value *= 3; break;
            case "DW": currentMultiplier = 2; break;
            case "TW": currentMultiplier = 3; break;
          }
          multiplier *= currentMultiplier;
          
          // Vertical words
          let bonusPoints = 0;
          
          // Up
          for (let r = i - 1; r >= 0; --r) {
            let letter = this.board.getTile(r, j + k);
            if (!letter) break;
            if (!this.board.isWildcard(r, j + k))
              bonusPoints += LETTER_VALUES[letter];
          }

          // Down
          for (let r = i + 1; r < rows; ++r) {
            let letter = this.board.getTile(r, j + k);
            if (!letter) break;
            if (!this.board.isWildcard(r, j+k))
              bonusPoints += LETTER_VALUES[letter];
          }
          
          // This letter is used twice (in 2 directions)
          // and the points from the other word are added.
          if (bonusPoints) {
            totalBonusPoints += (bonusPoints + value) * currentMultiplier;
            letterBonusPoints[k] = value * currentMultiplier;
          }
          
          totalPoints += value;
          letterPoints[k] = value;
        }
      } else {
        // Vertical play
        for (let k = 0; k < word.length; ++k) {
          let letter = word[k];
          let value = LETTER_VALUES[letter];
          let bonus = tileBonuses[i + k][j];
          
          // If the tile is already played then just add the value
          if (this.board.getTile(i + k, j)) {
            if (!this.board.isWildcard(i + k, j))
              totalPoints += value;
            continue;
          } else {
            // Played tile bonus
            // value += LETTER_BONUS[letter];
          }
          
          ++lettersUsed;
          
          let currentMultiplier = 1;
          switch (bonus) {
            case "DL": value *= 2; break;
            case "TL": value *= 3; break;
            case "DW": currentMultiplier = 2; break;
            case "TW": currentMultiplier = 3; break;
          }
          multiplier *= currentMultiplier;
          
          // Vertical words
          let bonusPoints = 0;
          
          // Left
          for (let c = j - 1; c >= 0; --c) {
            let letter = this.board.getTile(i + k, c);
            if (!letter) break;
            if (!this.board.isWildcard(i + k, c))
              bonusPoints += LETTER_VALUES[letter];
          }

          // Right
          for (let c = j + 1; c < cols; ++c) {
            let letter = this.board.getTile(i + k, c);
            if (!letter) break;
            if (!this.board.isWildcard(i + k, c))
              bonusPoints += LETTER_VALUES[letter];
          }
          
          // This letter is used twice (in 2 directions)
          // and the points from the other word are added.
          if (bonusPoints) {
            totalBonusPoints += (bonusPoints + value) * currentMultiplier;
            letterBonusPoints[k] = value * currentMultiplier;
          }
          
          totalPoints += value;
          letterPoints[k] = value;
        }
      }
      
      for (let j = 0; j < wildcards.length; ++j) {
        // Find the cheapest letters to remove
        let minLetter = { points: Infinity, i: -1 };
        for (let i = 0; i < word.length; ++i) {
          if (word[i] != wildcards[j]) continue;
          let points = letterPoints[i] * multiplier + letterBonusPoints[i];
          if (points < minLetter.points) {
            minLetter.points = points;
            minLetter.i = i;
          }
        }
        
        // Subtract off the minLetter points
        totalPoints -= letterPoints[minLetter.i];
        totalBonusPoints -= letterBonusPoints[minLetter.i];
      }
      
      // Mutliplier
      totalPoints *= multiplier;
      
      // Bonus 35 for playing all the letters
      if (lettersUsed == 7) totalPoints += 35;
      totalPoints += totalBonusPoints;
      
      // Set word point score
      play.points = totalPoints;
    }
    
    // Sort the plays by top score
    this.plays.sort((a, b) => b.points - a.points);
  }
  
  getTop(n = 10) {
    let out = "";
    for (let k = 0; k < Math.min(n, this.plays.length); ++k) {
      const play = this.plays[k];
      const { word, i, j, dir, points } = play;
      out += `${word} : ${i} ${j} ${dir} (${points})\n`;
    }
    return out;
  }
  
}

class WordBoard {
  constructor() {
    
  }
  
  init(rows, cols) {
    // Setup tiles
    this.rows = rows;
    this.cols = cols;
    this.tiles = Array(rows);
    for (let i = 0; i < rows; ++i) {
      this.tiles[i] = Array(cols);
      for (let j = 0; j < cols; ++j) {
        this.tiles[i][j] = "";
      }
    }
    
    // Tile bag and letters (7 max)
    this.letters = letterBank;
    this.tilebag = {};
    this.wildcards = [];
  }
  
  clear() {
    this.init(this.rows, this.cols);
  }
  
  setTile(letter, i, j) {
    setTile(letter, i, j);
    this.tiles[i][j] = letter;
    if (letter == "" && this.isWildcard(i, j)) toggleWildcardTile(i, j);
  }
  
  getTile(i, j) {
    return this.tiles[i][j];
  }
  
  setWildcard(i, j) {
    if (this.isWildcard(i, j)) return;
    this.wildcards.push({ i, j });
  }
  
  removeWildcard(i, j) {
    if (!this.isWildcard(i, j)) return;
    for (let k = this.wildcards.length - 1; k >= 0; --k) {
      let wildcard = this.wildcards[k];
      if (wildcard.i == i && wildcard.j == j) {
        this.wildcards.splice(k, 1);
        return;
      }
    }
  }
  
  isWildcard(i, j) {
    for (let wildcard of this.wildcards) {
      if (wildcard.i == i && wildcard.j == j)
        return true;
    }
    
    return false;
  }
  
  loadPreset() {
    // this.setTile("w", 4, 5);
    // this.setTile("o", 4, 6);
    // this.setTile("r", 4, 7);
    // this.setTile("d", 4, 8);
    // this.setTile("s", 4, 9);
    // this.setTile("i", 5, 5);
    // this.setTile("t", 6, 5);
    // this.setTile("h", 7, 5);
    // this.setTile("f", 3, 7);
    // this.setTile("i", 5, 7);
    // this.setTile("e", 6, 7);
    // this.setTile("n", 7, 7);
    // this.setTile("d", 8, 7);
    // this.setTile("s", 9, 7);
    
    // this.setTile("j", 6, 7);
    // this.setTile("u", 7, 7);
    // this.setTile("r", 8, 7);
    // this.setTile("i", 9, 7);
    // this.setTile("e", 10, 7);
    // this.setTile("d", 11, 7);
    // this.setTile("b", 7, 6);
    // this.setTile("t", 7, 8);
    // this.setTile("e", 8, 8);
    // this.setTile("a", 8, 9);
    // this.setTile("d", 8, 10);
    // this.setTile("y", 8, 11);
    // this.setTile("t", 7, 11);
    // this.setTile("h", 6, 11);
    // this.setTile("g", 5, 11);
    // this.setTile("u", 4, 11);
    // this.setTile("a", 3, 11);
    // this.setTile("h", 2, 11);
    // this.setTile("z", 5, 9);
    // this.setTile("i", 5, 10);
    
    // this.setTile("o", 1, 5);
    // this.setTile("r", 1, 6);
    // this.setTile("e", 1, 7);
    // this.setTile("g", 1, 8);
    // this.setTile("a", 1, 9);
    // this.setTile("n", 1, 10);
    // this.setTile("o", 1, 11);
    
  }
  
  updateLetters() {
    this.letters = letterBank;
  }
}

function loadWordList() {
  solver.loadWordList([...wordList, ...missingWords]);
}

function removeDuplicates(arr, key1, key2, key3, key4) {
  seen = new Set();
  return arr.filter(obj => {
    const key = `${obj[key1]}|${obj[key2]}|${obj[key3]}|${obj[key4]}`;
    if (!seen.has(key)) {
      seen.add(key);
      return true;
    }
    return false;
  });
}

function wordFilter(word) {
  return word != "";
  // word = word.toLowerCase();
  // return (word != "") && /^[a-z]+$/.test(word);
}

function getLetterValue(letter, played = false) {
  return played ? LETTER_VALUES[letter] + LETTER_BONUS[letter] : LETTER_VALUES[letter];
}

function isWordFormat(letters) {
  return letters == "" || /^[a-z?]+$/.test(letters.toLowerCase());
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*






















*/
