import "@testing-library/jest-dom";

// Polyfill ResizeObserver for recharts ResponsiveContainer in jsdom
class ResizeObserverMock {
  // keep signature for compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Assign to global for jsdom environment without using 'any'
const g = globalThis as unknown as { ResizeObserver?: typeof ResizeObserver };
g.ResizeObserver = g.ResizeObserver || (ResizeObserverMock as unknown as typeof ResizeObserver);
