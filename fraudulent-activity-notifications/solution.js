'use strict';

const fs = require('fs');

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString = '';
let currentLine = 0;

process.stdin.on('data', inputStdin => {
    inputString += inputStdin;
});

process.stdin.on('end', _ => {
    inputString = inputString.replace(/\s*$/, '')
        .split('\n')
        .map(str => str.replace(/\s*$/, ''));

    main();
});

function readLine() {
    return inputString[currentLine++];
}

// Complete the activityNotifications function below.
function activityNotifications(expenditure, d) {
    // Initialize array of expenditure counts
    let countArr = Array(201).fill(0);
    for (let i = 0; i < d; i++) {
        const expVal = expenditure[i];
        countArr[expVal]++;
    }

    // Get indices for median values
    const isEven = (d % 2 === 0);
    const medCount1 = isEven ? (d / 2) : (d + 1) / 2; // e.g. 4 -> 2, 5 -> 3
    const medCount2 = isEven ? medCount1 + 1 : medCount1;

    let fraudCount = 0;
    const numExpenditures = expenditure.length;
    for (let dayIdx = d; dayIdx < numExpenditures; dayIdx++) {
        const newDayExp = expenditure[dayIdx];
        if (dayIdx > d) {
            const removeIdx = dayIdx - d - 1;
            const removeExp = expenditure[removeIdx];
            const addIdx = dayIdx - 1;
            const addExp = expenditure[addIdx];
            updateCountArr(countArr, removeExp, addExp);
        }
        // Find median value in countArr
        const med = getMedianValue(countArr, medCount1, medCount2);
        const isPossibleFraud = (newDayExp >= (2 * med));
        if (isPossibleFraud) {
            fraudCount++;
        }
    }
    return fraudCount;
}

function getMedianValue(countArr, medCount1, medCount2) {
    let expVal = 0; // 0 to 200
    let sum = 0;
    let medVal1;
    let medVal2;

    while (medVal1 === undefined || medVal2 === undefined) {
        const count = countArr[expVal];
        if (count === 0) {
            expVal++;
            continue;
        }
        sum += count;
        if (medVal1 === undefined && sum >= medCount1) {
            medVal1 = expVal;
        }
        if (medVal2 === undefined && sum >= medCount2) {
            medVal2 = expVal;
        }
        expVal++;
    }
    
    const medVal = (medVal1 === medVal2) ? medVal1 : ((medVal1 + medVal2) / 2);

    return medVal;
}

function updateCountArr(countArr, removeExp, newDayExp) {
    if (removeExp === newDayExp) {
        return;
    }
    countArr[removeExp]--;
    countArr[newDayExp]++;
}

function main() {
    const ws = fs.createWriteStream(process.env.OUTPUT_PATH);

    const nd = readLine().split(' ');

    const n = parseInt(nd[0], 10);

    const d = parseInt(nd[1], 10);

    const expenditure = readLine().split(' ').map(expenditureTemp => parseInt(expenditureTemp, 10));

    let result = activityNotifications(expenditure, d);

    ws.write(result + "\n");

    ws.end();
}
