
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Sidebar } from '../../src/components/Sidebar';
import { useStore, createDefaultElement } from '../../src/store';

describe('Sidebar Component', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      elements: [],
      selectedIds: [],
      history: { past: [], present: [], future: [] },
      tool: 'select',
      theme: 'dark',
      sidebarTab: 'library',
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  });

  it('renders the Library tab by default', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('Layers')).toBeInTheDocument();
    
    // Check for some shape categories or search input
    expect(screen.getByPlaceholderText('Search 100+ shapes...')).toBeInTheDocument();
  });

  it('switches to the Inspector tab', () => {
    render(<Sidebar />);
    
    const inspectorTabBtn = screen.getByText('Inspector').closest('button');
    fireEvent.click(inspectorTabBtn!);
    
    expect(useStore.getState().sidebarTab).toBe('inspector');
    expect(screen.getByText('No element selected')).toBeInTheDocument();
  });

  it('shows properties in Inspector when an element is selected', () => {
    const el = createDefaultElement('shape', 'rectangle', 0, 0);
    useStore.getState().addElements([el]);
    useStore.getState().selectElement(el.id);
    useStore.getState().setSidebarTab('inspector');
    
    render(<Sidebar />);
    
    // Should show dimensions input fields or related labels for the shape
    expect(screen.getByText('Transform')).toBeInTheDocument();
    expect(screen.getByText('Fill Color')).toBeInTheDocument();
  });

  it('switches to the Layers tab', () => {
    render(<Sidebar />);
    
    const layersTabBtn = screen.getAllByText('Layers')[0].closest('button'); // First one is the tab
    fireEvent.click(layersTabBtn!);
    
    expect(useStore.getState().sidebarTab).toBe('layers');
    // If no elements, check empty layers state (if implemented, otherwise just check tab switch)
  });
});
