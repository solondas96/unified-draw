import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportToJSON, importFromJSON } from '../src/utils/exportImport';
import type { Canvas } from '../src/types';

describe('Export/Import Utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export canvas data to JSON file', () => {
    const mockCanvas: Canvas = {
      id: 'test-canvas-1',
      name: 'Test Diagram',
      version: 1,
      createdAt: 12345,
      updatedAt: 12345,
      elements: [],
      zoom: 1,
      panX: 0,
      panY: 0,
    };

    // Spy on HTMLAnchorElement.prototype.click
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    exportToJSON(mockCanvas);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should import canvas data from JSON file', async () => {
    const mockCanvasData: Canvas = {
      id: 'test-canvas-2',
      name: 'Imported Diagram',
      version: 1,
      createdAt: 12345,
      updatedAt: 12345,
      elements: [],
      zoom: 1.5,
      panX: 10,
      panY: 20,
    };

    const file = new File([JSON.stringify(mockCanvasData)], 'diagram.json', { type: 'application/json' });

    const result = await importFromJSON(file);

    expect(result.id).toBe('test-canvas-2');
    expect(result.name).toBe('Imported Diagram');
    expect(result.zoom).toBe(1.5);
    expect(result.elements).toEqual([]);
  });
});
