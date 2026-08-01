import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock IndexedDB / idb-keyval to avoid breaking in jsdom
vi.mock("idb-keyval", () => {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock Konva since Canvas isn't natively supported in jsdom
vi.mock("react-konva", () => {
  return {
    Stage: ({ children }: any) => <div data-testid="mock-stage">{children}</div>,
    Layer: ({ children }: any) => <div data-testid="mock-layer">{children}</div>,
    Rect: () => <div data-testid="mock-rect" />,
    Circle: () => <div data-testid="mock-circle" />,
    Line: () => <div data-testid="mock-line" />,
    Text: () => <div data-testid="mock-text" />,
    Ellipse: () => <div data-testid="mock-ellipse" />,
    Arrow: () => <div data-testid="mock-arrow" />,
    Star: () => <div data-testid="mock-star" />,
    RegularPolygon: () => <div data-testid="mock-regular-polygon" />,
    Shape: () => <div data-testid="mock-shape" />,
    Path: () => <div data-testid="mock-path" />,
    Group: ({ children }: any) => <div data-testid="mock-group">{children}</div>,
  };
});
