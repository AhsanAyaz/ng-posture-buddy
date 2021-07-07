function mockWindow() {
  Object.defineProperty(global, "window", {
    value: {
      require: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      writable: true,
    },
  });
}

mockWindow();
