function mockWindow() {
  Object.defineProperty(global, "window", {
    value: {
      require: jest.fn(),
      writable: true,
    },
  });
}

mockWindow();
