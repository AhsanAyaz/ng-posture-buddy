export default jest.mock("ml5", () => {
  return {
    posenet: jest.fn(),
    neuralNetwork: jest.fn(),
  };
});
