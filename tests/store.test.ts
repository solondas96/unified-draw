import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, createDefaultElement } from '../src/store';

describe('Zustand Store Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      elements: [],
      selectedIds: [],
      history: { past: [], present: [], future: [] },
      tool: 'select',
      theme: 'dark',
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  });

  it('should initialize with default state', () => {
    const state = useStore.getState();
    expect(state.elements).toEqual([]);
    expect(state.tool).toBe('select');
    expect(state.theme).toBe('dark');
  });

  it('should toggle theme', () => {
    useStore.getState().toggleTheme();
    expect(useStore.getState().theme).toBe('light');
    useStore.getState().toggleTheme();
    expect(useStore.getState().theme).toBe('dark');
  });

  it('should add an element', () => {
    const el = createDefaultElement('shape', 'rectangle', 0, 0);
    useStore.getState().addElement(el);
    expect(useStore.getState().elements).toHaveLength(1);
    expect(useStore.getState().elements[0].id).toBe(el.id);
  });

  it('should update an element', () => {
    const el = createDefaultElement('shape', 'rectangle', 0, 0);
    useStore.getState().addElement(el);
    useStore.getState().updateElement(el.id, { x: 100, y: 100 });
    const updated = useStore.getState().elements[0];
    expect(updated.x).toBe(100);
    expect(updated.y).toBe(100);
  });

  it('should handle selection', () => {
    const el1 = createDefaultElement('shape', 'rectangle', 0, 0);
    const el2 = createDefaultElement('shape', 'circle', 50, 50);
    useStore.getState().addElements([el1, el2]);
    
    useStore.getState().selectElement(el1.id);
    expect(useStore.getState().selectedIds).toEqual([el1.id]);
    
    // Additive selection
    useStore.getState().selectElement(el2.id, true);
    expect(useStore.getState().selectedIds).toContain(el1.id);
    expect(useStore.getState().selectedIds).toContain(el2.id);
    
    useStore.getState().clearSelection();
    expect(useStore.getState().selectedIds).toEqual([]);
  });

  it('should handle undo and redo', () => {
    const el = createDefaultElement('shape', 'rectangle', 0, 0);
    
    // Action 1: Add element
    useStore.getState().addElement(el);
    expect(useStore.getState().elements).toHaveLength(1);
    expect(useStore.getState().canUndo()).toBe(true);
    
    // Undo Action 1
    useStore.getState().undo();
    expect(useStore.getState().elements).toHaveLength(0);
    expect(useStore.getState().canRedo()).toBe(true);
    
    // Redo Action 1
    useStore.getState().redo();
    expect(useStore.getState().elements).toHaveLength(1);
  });

  it('should handle tool changing', () => {
    useStore.getState().setTool('rectangle');
    expect(useStore.getState().tool).toBe('rectangle');
  });
});
