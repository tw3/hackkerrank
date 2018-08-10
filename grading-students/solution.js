function gradingStudents(grades) {
  var newGrades = [];
  for (grade of grades) {
    var newGrade = getNewGrade(grade);
    newGrades.push(newGrade);
    console.log(newGrade);
  }
  return newGrades;
}

function getNewGrade(grade) {
  var shoudNotRound = (grade < 38);
  if (shoudNotRound) {
    return grade;
  }
  var mod = grade % 5;
  var shouldRoundUp = (mod >= 3);
  if (shouldRoundUp) {
    grade = grade + (5 - mod);
  }
  return grade;
}

var g = [73, 67, 38, 33];
gradingStudents(g);