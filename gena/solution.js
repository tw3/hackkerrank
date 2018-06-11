class TowerSolver {

  constructor(discPositionArray, numRods) {
    this.discPositionArray = discPositionArray;
    this.numDiscs = discPositionArray.length;
    this.numRods = numRods;
    this.towersSeen = {};
    this.rod1TargetDisc = this.numDiscs;
    this.debugFlag = false;
  }

  solve() {
    // Get initial tower
    const initialTower = this.getInitialTower();
  
    let towerSolution;
    const foundAnswer = this.isTowerRestored(initialTower);
    if (foundAnswer) {
      towerSolution = initialTower;
    } else {
      towerSolution = this.rearrangeTower(initialTower);
    }
  
    if (towerSolution === undefined) {
      return undefined;
    }
    const numMoves = towerSolution[0];
    if (this.debugFlag) console.log("numMoves", numMoves);
    return numMoves;
  }
  
  rearrangeTower(initialTower) {
    const initialTowerKey = JSON.stringify(initialTower);
    this.towersSeen[initialTowerKey] = true;

    const towerQueues = {
      current: [initialTower],
      nextTarget: [],
      nextPossible: []
    }

    while (true) {
      // Get current tower
      let currentTower;
      if (towerQueues.current.length > 0) {
        currentTower = towerQueues.current.shift(); // e.g. [0, [1, 3], [], [], [2]]
      } else {
        // no more queued towers for the current level, check next level
        if (towerQueues.nextTarget.length > 0) {
          towerQueues.current = towerQueues.nextTarget;
          if (this.debugFlag || true) {
            console.log("new (target) towers queue");
            towerQueues.current.forEach(targetTower => console.log("  ", targetTower));
          }
          this.rod1TargetDisc--;  
          towerQueues.nextTarget = [];
          towerQueues.nextPossible = [];
          continue;
        } else if (towerQueues.nextPossible.length > 0) {
          towerQueues.current = towerQueues.nextPossible;
          towerQueues.nextPossible = [];
          continue;
        } else {
          // No current, target, or possible towers...exit loop
          break;
        }
      }
      if (this.debugFlag) console.log("currentTower", currentTower);

      // Get next options for each rod for the current tower
      for (let rodNum = 1; rodNum <= this.numRods; rodNum++) {
        if (this.debugFlag) console.log("getting discs for rod", rodNum);
        // Get discs on this rod
        const rodDiscs = currentTower[rodNum]; // e.g. currentTower[1] = [1, 3]
  
        // Go to next rod if there are no discs on this rod
        if (rodDiscs.length === 0) {
          continue;
        }
  
        // Get the next tower options from moving the current rod
        const mustBeTarget = (towerQueues.nextTarget.length > 0);
        const nextTowerOptons = this.getNextTowerOptions(currentTower, rodNum, mustBeTarget);

        // Return the answer if it has been found
        if (nextTowerOptons.answer !== undefined) {
          return nextTowerOptons.answer;
        }

        // Add to target towers queue (if any)
        if (nextTowerOptons.target.length > 0) {
          if (this.debugFlag) {
            console.log('target towers');
            nextTowerOptons.target.forEach(targetTower => console.log("  ", targetTower));
          }
          towerQueues.nextTarget.push(...nextTowerOptons.target);
          continue;
        }

        // Continue looping if we are only looking for target towers
        if (mustBeTarget) {
          continue;
        }

        // Continue looping if there are no possibilities
        const possibleTowers = nextTowerOptons.possible;        
        if (possibleTowers.length === 0) {
          continue;
        }
  
        // Add the possible towers to the end of the queue
        towerQueues.nextPossible.push(...possibleTowers);
      }
    }
  
    // No answer
    return undefined;
  }
  
  getNextTowerOptions(currentTower, currentRodNum, mustBeTarget) {
    const nextTowerOptions = {
      answer: undefined,
      target: [],
      possible: []
    };
    for (let newRodNum = 1; newRodNum <= this.numRods; newRodNum++) {
      // Must be a different rod
      if (currentRodNum === newRodNum) {
        continue;
      }
  
      // Can only move to a rod that is empty or has a higher top disc
      // e.g. Given [ [3], [], [], [2] ] then Disc 1 can move to the 2nd, 3rd, or 4th rods
      const newRodDiscs = currentTower[newRodNum]; // e.g. []
      const topDiscNum = currentTower[currentRodNum][0];
      const isLegalMove = (newRodDiscs.length === 0 || newRodDiscs[0] > topDiscNum);
      if (!isLegalMove) {
        if (this.debugFlag) console.log("move disc", topDiscNum, "to rod", newRodNum, "is not legal");
        continue;
      }
  
      // Move top disc from current rod to new rod and increment counter
      const possibleTower = this.cloneTower(currentTower);
      possibleTower[currentRodNum].shift(); // remove top disc
      possibleTower[newRodNum].unshift(topDiscNum); // add disc to top of new rod
  
      // Check if tower has already been seen
      const towerKey = JSON.stringify(possibleTower);
      if (this.towersSeen.hasOwnProperty(towerKey)) {
        if (this.debugFlag) console.log("already seen", possibleTower);
        continue;
      }
  
      // Increment move counter and add to towers seen
      possibleTower[0] = currentTower[0] + 1;
      this.towersSeen[towerKey] = true;
  
      // Return early if we found the answer
      const foundAnswer = this.isTowerRestored(possibleTower);
      if (foundAnswer) {
        nextTowerOptions.possible = [];
        nextTowerOptions.target = [];
        nextTowerOptions.answer = possibleTower;
        return nextTowerOptions;
      }

      // Return early if the target disc is on rod 1
      const rod1Discs = possibleTower[1];
      const isTarget = (rod1Discs.length > 0 && rod1Discs[0] === this.rod1TargetDisc);
      if (isTarget) {
        if (this.debugFlag) console.log(`TARGET: disc ${this.rod1TargetDisc} is on rod 1 => `, possibleTower);
        nextTowerOptions.possible = [];
        nextTowerOptions.target.push(possibleTower);
        mustBeTarget = true;
        continue;
      }

      // Continue if must be a target
      if (mustBeTarget) {
        continue;
      }
  
      // Add the possible tower to the result array
      nextTowerOptions.possible.push(possibleTower);
    }
    return nextTowerOptions;
  }
  
  isTowerRestored(tower) {
    // Things are restored when disc 1 has all discs
    const rod1Discs = tower[1];
    const result = (rod1Discs.length === this.numDiscs);
    return result;
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
      initialTower[0] = 0; // "Rod" 0 will maintain the number of moves
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
        // if (this.debugFlag) console.log(allRodDiscs);
      }
      if (this.debugFlag || true) console.log("initialized", initialTower);
      return initialTower;
  }
}

// const a = [1, 4, 1];
// const a = [1, 3, 3];
const a = [4,1,2,1,4,3,3,4,3,4];
const numRods = 4;
const towerSolver = new TowerSolver(a, numRods);
const result = towerSolver.solve();
console.log(result);
