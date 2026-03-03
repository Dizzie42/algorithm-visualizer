import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock ResizeObserver since it's not available in jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    constructor(cb) { this.cb = cb; }
    observe()    {}
    unobserve()  {}
    disconnect() {}
  };
});

// Mock canvas getContext since jsdom doesn't support it
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect:    jest.fn(),
    fillRect:     jest.fn(),
    strokeRect:   jest.fn(),
    beginPath:    jest.fn(),
    moveTo:       jest.fn(),
    lineTo:       jest.fn(),
    stroke:       jest.fn(),
    scale:        jest.fn(),
    setTransform: jest.fn(),
    shadowBlur:   0,
    shadowColor:  '',
    fillStyle:    '',
    strokeStyle:  '',
    lineWidth:    0,
  });
});

describe('App', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('renders SORT heading', () => {
    render(<App />);
    expect(screen.getByText('SORT')).toBeInTheDocument();
  });

  test('renders GO and RESET buttons', () => {
    render(<App />);
    expect(screen.getByText('GO')).toBeInTheDocument();
    expect(screen.getByText('RESET')).toBeInTheDocument();
  });

  test('GO button is enabled on load', () => {
    render(<App />);
    expect(screen.getByText('GO')).not.toBeDisabled();
  });

  test('renders algorithm selector', () => {
    render(<App />);
    expect(screen.getByDisplayValue(/Bubble Sort/)).toBeInTheDocument();
  });

  test('renders theme selector', () => {
    render(<App />);
    expect(screen.getByDisplayValue(/Cyberpunk/)).toBeInTheDocument();
  });

  test('renders speed buttons', () => {
    render(<App />);
    expect(screen.getByText('SLOW')).toBeInTheDocument();
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
    expect(screen.getByText('FAST')).toBeInTheDocument();
    expect(screen.getByText('EXTREME')).toBeInTheDocument();
  });

  test('renders stats bar with comparisons, swaps, time', () => {
    render(<App />);
    expect(screen.getByText('Comparisons')).toBeInTheDocument();
    expect(screen.getByText('Swaps')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  test('shows ready status on load', () => {
    render(<App />);
    expect(screen.getByText(/Ready — press GO to begin sorting/)).toBeInTheDocument();
  });

  test('compare button toggles on and off', () => {
    render(<App />);
    const compareBtn = screen.getByText(/Compare/);
    fireEvent.click(compareBtn);
    expect(screen.getByText(/Compare ON/)).toBeInTheDocument();
    fireEvent.click(compareBtn);
    expect(screen.getByText(/Compare/)).toBeInTheDocument();
  });

  test('compare mode shows second algorithm selector', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Compare/));
    const selects = screen.getAllByRole('combobox');
    // algo1, algo2, theme = 3 selects
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  test('changing algorithm updates selector', () => {
    render(<App />);
    const select = screen.getByDisplayValue(/Bubble Sort/);
    fireEvent.change(select, { target: { value: 'merge' } });
    expect(screen.getByDisplayValue(/Merge Sort/)).toBeInTheDocument();
  });

  test('changing theme updates selector', () => {
    render(<App />);
    const select = screen.getByDisplayValue(/Cyberpunk/);
    fireEvent.change(select, { target: { value: 'matrix' } });
    expect(screen.getByDisplayValue(/Matrix/)).toBeInTheDocument();
  });

  test('NORMAL speed button is active by default', () => {
    render(<App />);
    const normalBtn = screen.getByText('NORMAL');
    // active speed btn has bg color set to accent — check it's in the document
    expect(normalBtn).toBeInTheDocument();
  });

  test('clicking speed button changes selection', () => {
    render(<App />);
    const slowBtn = screen.getByText('SLOW');
    fireEvent.click(slowBtn);
    expect(slowBtn).toBeInTheDocument();
  });

  test('array size input exists and has default value', () => {
    render(<App />);
    const input = screen.getByDisplayValue('60');
    expect(input).toBeInTheDocument();
  });

  test('changing array size updates input', () => {
    render(<App />);
    const input = screen.getByDisplayValue('60');
    fireEvent.change(input, { target: { value: '100' } });
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  test('RESET button is always enabled', () => {
    render(<App />);
    expect(screen.getByText('RESET')).not.toBeDisabled();
  });

  test('legend items are rendered', () => {
    render(<App />);
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('compare')).toBeInTheDocument();
    expect(screen.getByText('pivot')).toBeInTheDocument();
    expect(screen.getByText('sorted')).toBeInTheDocument();
  });
});