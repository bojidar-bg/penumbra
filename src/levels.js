// eslint-disable-next-line no-unused-vars
export default [
  {
    walls: [
      [0, 4, 40, 2],
      [10, 4, 4],
    ],
    // enemies: [
    //   [0, 25],
    //   [0, 27],
    // ],
    start: [0, 0],
    goal: [35, 0],
    texts: [
      [0, -10, 'Hello stranger!'],
      [0, -5, 'Get to the green square to continue (A/D/Left/Right)'],
    ],
  },
  {
    walls: [
      [0, 0, 18, 2],
      [0, 10, 18, 2],
    ],
    start: [0, -10],
    goal: [0, 5],
    texts: [
      [0, -10, 'Use your mouse to create shadows'],
    ],
  },
  {
    walls: [
      [-20, 10, 18, 2],
      [20, 2, 18, 2],
      [42, -2, 2, 2],
    ],
    start: [-20, 0],
    goal: [42, -6],
    texts: [
      [0, -10, 'Try making a ramp to jump'],
    ],
  },
  {
    walls: [
      [0, 27, 40, 25],
    ],
    start: [0, 0],
    goal: [35, -25],
    texts: [
      [25, -5, 'Try making a shadow here'],
      [25, 0, 'V'],
    ],
  },
  {
    walls: [
      [0, 25, 28, 3],
      [25, 0, 3, 28],
    ],
    start: [0, 17],
    goal: [35, 0],
    texts: [
      [0, 0, 'Elevator!'],
    ],
  },
];
