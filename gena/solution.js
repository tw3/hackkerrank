/**
 * The keys to solving this challenge:
 * 
 * 1) Do breadth-first search, keep a running queue of
 *    the next options at each given step.
 * 
 * 2) Cache the rod sequeuences as you encounter them
 *    including variations of the 2nd, 3rd, and 4th rods.
 *    e.g. this tower:
 *      [ x, [1, 2, 3], [4, 5], [6, 7], [8, 9] ]
 *    ...is equivalent to:
 *      [ x, [1, 2, 3], [6, 7], [4, 5], [8, 9] ]
 *    ...and also equivalent to:
 *      [ x, [1, 2, 3], [4, 5], [8, 9], [6, 7] ]
 *    ...etc...
 * 
 * 3) When determining the next options you can skip
 *    variations that you've seen already.
 * 
 * 4) Greedy searching based on the first tower does
 *    not work.
 */

class TowerSolver {

  constructor(discPositionArray, numRods, debugFlag) {
    this.discPositionArray = discPositionArray;
    this.numDiscs = discPositionArray.length;
    this.numRods = numRods;
    this.debugFlag = debugFlag;
    this.towersSeen = {};
  }

  setShouldReturnPath(shouldReturnPath) {
    this.shouldReturnPath = shouldReturnPath;
  }

  solve() {
    // Get initial tower
    const initialTower = this.getInitialTower();
  
    const isRestored = this.isTowerRestored(initialTower);
    if (isRestored) {
      const returnValue = getReturnValue(initialTower);
      return returnValue;
    }

    const towerSolution = this.rearrangeTower(initialTower);
    const returnValue = this.getReturnValue(towerSolution);
    return returnValue;
  }
  
  rearrangeTower(initialTower) {
    this.cacheTowerVariations(initialTower);

    const towerQueue = [initialTower];

    while (towerQueue.length > 0) {
      const currentTower = towerQueue.shift(); // e.g. [0, [1, 3], [], [], [2]]
      if (this.debugFlag && false) console.log("currentTower", currentTower);

      // Get next options for each rod for the current tower
      for (let rodNum = 1; rodNum <= this.numRods; rodNum++) {
        if (this.debugFlag && false) console.log("getting discs for rod", rodNum);
        // Get discs on this rod
        const rodDiscs = currentTower[rodNum]; // e.g. currentTower[1] = [1, 3]
  
        // Go to next rod if there are no discs on this rod
        if (rodDiscs.length === 0) {
          continue;
        }
  
        // Get the next tower options from moving the current rod
        const nextTowerOptons = this.getNextTowerOptions(currentTower, rodNum);

        // Return the answer if it has been found
        if (nextTowerOptons.answer !== undefined) {
          if (this.debugFlag) console.log("ANSWER: ", currentTower, "->", nextTowerOptons.answer);
          return nextTowerOptons.answer;
        }

        // Continue looping if there are no possibilities
        const possibleTowers = nextTowerOptons.possible;        
        if (possibleTowers.length === 0) {
          continue;
        }
  
        if (this.debugFlag) {
          console.log('possible towers for rod ', rodNum);
          possibleTowers.forEach(possibleTower => console.log("  ", currentTower, "->", possibleTower));
        }
        // Add the possible towers to the end of the queue
        towerQueue.push(...possibleTowers);
      }
    }
  
    // No answer
    return undefined;
  }
  
  getNextTowerOptions(currentTower, currentRodNum) {
    const nextTowerOptions = {
      answer: undefined,
      possible: []
    };
    for (let newRodNum = 1; newRodNum <= this.numRods; newRodNum++) {
      // Must be a different rod
      if (currentRodNum === newRodNum) {
        continue;
      }

      const newRodDiscs = currentTower[newRodNum]; // e.g. []
      const currentRodDiscs = currentTower[currentRodNum]; // e.g. [3]
      const isNewRodEmpty = (newRodDiscs.length === 0); // e.g. true

      if (currentRodNum != 1 && newRodNum != 1) {
        // It is pointless to swap a single length rod and an empty rod
        // for the 2nd, 3rd, and 4th rods
        // e.g. [ x, [y], [3], [] [z] ] -> [ x, [y], [], [3] [z] ]
        if (isNewRodEmpty && currentRodDiscs.length === 1) {
          continue;
        }
      }
  
      // Can only move to a rod that is empty or has a higher top disc
      // e.g. given [ x, [3], [], [], [2] ] then disc 3 cannot move the 4th rod
      const currentRodTopDiscNum = currentRodDiscs[0];
      const isLegalMove = (isNewRodEmpty || newRodDiscs[0] > currentRodTopDiscNum);
      if (!isLegalMove) {
        if (this.debugFlag && false) console.log("move disc", currentRodTopDiscNum, "to rod", newRodNum, "is not legal");
        continue;
      }
  
      // Move top disc from current rod to new rod and increment counter
      const possibleTower = this.cloneTower(currentTower);
      possibleTower[currentRodNum].shift(); // remove top disc
      possibleTower[newRodNum].unshift(currentRodTopDiscNum); // add disc to top of new rod
  
      // Check if new tower has already been seen
      const towerKey = this.getTowerKey(possibleTower);
      if (this.isTowerSeen(towerKey)) {
        continue;
      }
  
      // Increment move counter and add to towers seen
      possibleTower[0] = currentTower[0] + 1;
      this.cacheTowerVariations(possibleTower, towerKey, currentTower);
  
      // Return early if we found the answer
      const foundAnswer = this.isTowerRestored(possibleTower);
      if (foundAnswer) {
        nextTowerOptions.possible = [];
        nextTowerOptions.answer = possibleTower;
        return nextTowerOptions;
      }

      // Add the new tower to the next tower options as possibility
      nextTowerOptions.possible.push(possibleTower);
    }
    return nextTowerOptions;
  }
  
  isTowerRestored(tower) {
    // Things are restored when disc 1 has all discs
    const rod1Discs = tower[1];
    const isRestored = (rod1Discs.length === this.numDiscs);
    return isRestored;
  }
  
  cloneTower(tower) {
    const newTower = tower.map((rodDiscs, index) => {
      return (index === 0) ? 0 : rodDiscs.slice();
    });
    return newTower;
  }
  
  getInitialTower() {
      // Initialize rods on tower (no discs yet)
      const initialTower = Array(this.numRods + 1);
      // "Rod" 0 will maintain the number of moves aka the move counter
      initialTower[0] = 0;
      for (let rodNum = 1; rodNum <= this.numRods; rodNum++) {
        initialTower[rodNum] = [];
      }
      if (this.debugFlag) console.log("blank", initialTower);
    
      // Add initial discs to tower
      for (let discNum = 1; discNum <= this.numDiscs; discNum++) {
        const discIdx = discNum - 1;
        const rodNum = this.discPositionArray[discIdx];
        if (this.debugFlag) console.log(`pushing disc ${discNum} onto rod ${rodNum}`);
        initialTower[rodNum].push(discNum);
      }
      if (this.debugFlag) console.log("initialized", initialTower);
      return initialTower;
  }

  getTowerKey(tower) {
    return JSON.stringify(tower);
  }

  isTowerSeen(towerKey) {
    const isAlreadySeen = this.isAlreadySeen(towerKey);
    if (false && this.debugFlag && isAlreadySeen) console.log("already seen", towerKey);
    return isAlreadySeen;
  }

  // This method assumes there are 4 rods
  cacheTowerVariations(tower, towerKey234, prevTower) {
    // 2, 3, 4
    if (towerKey234 === undefined) {
      towerKey234 = this.getTowerKey(tower);
    }
    this.cacheTower(towerKey234, prevTower);
    // 3, 2, 4
    const towerVariation324 = [0, tower[1], tower[3], tower[2], tower[4]];
    const towerKey324 = this.getTowerKey(towerVariation324);
    this.cacheTower(towerKey324);
    // 2, 4, 3
    const towerVariation243 = [0, tower[1], tower[2], tower[4], tower[3]];
    const towerKey243 = this.getTowerKey(towerVariation243);
    this.cacheTower(towerKey243);
    // 4, 3, 2
    const towerVariation432 = [0, tower[1], tower[4], tower[3], tower[2]];
    const towerKey432 = this.getTowerKey(towerVariation432);
    this.cacheTower(towerKey432);
    // 3, 4, 2
    const towerVariation342 = [0, tower[1], tower[3], tower[4], tower[2]];
    const towerKey342 = this.getTowerKey(towerVariation342);
    this.cacheTower(towerKey342);
    // 4, 2, 3
    const towerVariation423 = [0, tower[1], tower[4], tower[2], tower[3]];
    const towerKey423 = this.getTowerKey(towerVariation423);
    this.cacheTower(towerKey423);
  }

  cacheTower(towerKey, prevTower) {
    if (this.isAlreadySeen(towerKey)) {
      return;
    }
    this.towersSeen[towerKey] = prevTower;
  }

  isAlreadySeen(towerKey) {
    return (this.towersSeen.hasOwnProperty(towerKey));
  }

  getReturnValue(tower) {
    if (tower === undefined) {
      return undefined;
    }
    if (this.shouldReturnPath) {
      const towerPath = this.getTowerPath(tower);
      return towerPath;
    }
    const numMoves = tower[0];
    return numMoves;
  }

  getTowerPath(tower) {
    const clonedTower = this.cloneTower(tower);
    const towerKey = this.getTowerKey(clonedTower);
    const prevTower = this.towersSeen[towerKey];
    if (prevTower === undefined) {
      return [];
    }
    return [...this.getTowerPath(prevTower), tower];
  }
}

if (typeof main === "undefined") {
  let a;
  a = [1, 4, 1];
  a = [1, 3, 3];
  a = [1, 3, 4, 2, 4, 3, 1]; // test case 9
  a = [4, 1, 2, 1, 4, 3, 3, 4, 3, 4]; // test case 11
  a = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]; // test case 16
  const numRods = 4;
  const towerSolver = new TowerSolver(a, numRods, false);
  towerSolver.setShouldReturnPath(true);
  
  const startTime = (new Date()).getTime();
  
  const result = towerSolver.solve();
  
  const endTime = (new Date()).getTime();
  const numSeconds = (endTime - startTime) / 1000;
  
  if (Array.isArray(result)) {
    console.log("Path:");
    result.forEach(tower => console.log(tower));
    console.log("Num Moves:", result.length);
  } else {
    console.log(result);
  }
  console.log("It took", numSeconds, "seconds");
}
