import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement BroadcastChannel
if (typeof (globalThis as any).BroadcastChannel === "undefined") {
  class MockBroadcastChannel {
    name: string;
    onmessage: ((e: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  (globalThis as any).BroadcastChannel = MockBroadcastChannel;
}
