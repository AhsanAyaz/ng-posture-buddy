export default class P5 {
  constructor() {
    this.push = jest.fn();
    this.translate = jest.fn();
    this.scale = jest.fn();
    this.image = jest.fn();
    this.push = jest.fn();
    this.pop = jest.fn();
  }
}

export default jest.fn().mockImplementation(() => {
  return new P5();
});

// jest.mock('./sound-player', () => {
//   return jest.fn().mockImplementation(() => {
//     return {playSoundFile: mockPlaySoundFile};
//   });
// });
