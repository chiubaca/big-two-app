//**
/* console.log(getPlayerOrder(0)); // [0, 1, 2, 3]
/* console.log(getPlayerOrder(1)); // [1, 2, 3, 0]
/* console.log(getPlayerOrder(2)); // [2, 3, 0, 1]
/* console.log(getPlayerOrder(3)); // [3, 0, 1, 2]
*/
export function makePlayerOrder(
  startingIndex: number
): [number, number, number, number] {
  const indices = [0, 1, 2, 3];
  const rotated = [
    ...indices.slice(startingIndex),
    ...indices.slice(0, startingIndex),
  ];
  return rotated as [number, number, number, number];
}
