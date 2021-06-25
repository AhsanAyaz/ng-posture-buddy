export default jest.mock("electron", () => {
  return {
    ipcRenderer: {
      on: jest.fn(),
    },
  };
});
