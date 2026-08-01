
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Toolbar } from '../../src/components/Toolbar';
import { useStore } from '../../src/store';

describe('Toolbar Component', () => {
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

  it('renders the branding and canvas title', () => {
    render(<Toolbar getStageRef={() => null} onOpenCanvasModal={vi.fn()} />);
    
    expect(screen.getByText('UnifiedDraw')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Untitled Diagram')).toBeInTheDocument();
  });

  it('changes the tool when a tool button is clicked', () => {
    render(<Toolbar getStageRef={() => null} onOpenCanvasModal={vi.fn()} />);
    
    const rectangleBtn = screen.getByTitle(/Rectangle/i);
    fireEvent.click(rectangleBtn);
    
    expect(useStore.getState().tool).toBe('rectangle');
  });

  it('toggles the theme when the theme button is clicked', () => {
    render(<Toolbar getStageRef={() => null} onOpenCanvasModal={vi.fn()} />);
    
    const themeBtn = screen.getByTitle(/Switch to Light Mode/i);
    fireEvent.click(themeBtn);
    
    expect(useStore.getState().theme).toBe('light');
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('updates the canvas title on input change', () => {
    render(<Toolbar getStageRef={() => null} onOpenCanvasModal={vi.fn()} />);
    
    const input = screen.getByDisplayValue('Untitled Diagram');
    fireEvent.change(input, { target: { value: 'New Diagram Name' } });
    
    expect(useStore.getState().canvasName).toBe('New Diagram Name');
  });
});
