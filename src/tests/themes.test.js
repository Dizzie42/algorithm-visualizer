import { themes } from '../themes';

const REQUIRED_UI_KEYS = [
  'bg',
  'panel',
  'border',
  'text',
  'textDim',
  'accent',
  'accentGlow',
];

const REQUIRED_COLOR_KEYS = [
  'default',
  'default_border',
  'active',
  'compare',
  'pivot',
  'sorted',
];

const REQUIRED_THEME_KEYS = [
  'name',
  'font',
  'displayFont',
  'ui',
  'colors',
];

// Helper — checks if a string looks like a valid CSS color
function isValidColor(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// ── Structure ─────────────────────────────────────────────────────────────────
describe('themes object', () => {
  test('exports a themes object', () => {
    expect(themes).toBeDefined();
    expect(typeof themes).toBe('object');
  });

  test('contains exactly 10 themes', () => {
    expect(Object.keys(themes).length).toBe(10);
  });

  test('all theme keys are strings', () => {
    Object.keys(themes).forEach(key => {
      expect(typeof key).toBe('string');
    });
  });
});

// ── Required keys ─────────────────────────────────────────────────────────────
describe('theme structure', () => {
  Object.entries(themes).forEach(([key, theme]) => {
    describe(key, () => {
      test('has all required top-level keys', () => {
        REQUIRED_THEME_KEYS.forEach(k => {
          expect(theme).toHaveProperty(k);
        });
      });

      test('name is a non-empty string', () => {
        expect(typeof theme.name).toBe('string');
        expect(theme.name.length).toBeGreaterThan(0);
      });

      test('font is a non-empty string', () => {
        expect(typeof theme.font).toBe('string');
        expect(theme.font.length).toBeGreaterThan(0);
      });

      test('displayFont is a non-empty string', () => {
        expect(typeof theme.displayFont).toBe('string');
        expect(theme.displayFont.length).toBeGreaterThan(0);
      });

      test('ui has all required keys', () => {
        REQUIRED_UI_KEYS.forEach(k => {
          expect(theme.ui).toHaveProperty(k);
        });
      });

      test('colors has all required keys', () => {
        REQUIRED_COLOR_KEYS.forEach(k => {
          expect(theme.colors).toHaveProperty(k);
        });
      });
    });
  });
});

// ── Color validity ────────────────────────────────────────────────────────────
describe('theme color values', () => {
  Object.entries(themes).forEach(([key, theme]) => {
    describe(key, () => {
      REQUIRED_UI_KEYS.forEach(uiKey => {
        test(`ui.${uiKey} is a valid color string`, () => {
          expect(isValidColor(theme.ui[uiKey])).toBe(true);
        });
      });

      REQUIRED_COLOR_KEYS.forEach(colorKey => {
        test(`colors.${colorKey} is a valid color string`, () => {
          expect(isValidColor(theme.colors[colorKey])).toBe(true);
        });
      });
    });
  });
});

// ── Uniqueness ────────────────────────────────────────────────────────────────
describe('theme uniqueness', () => {
  test('all theme names are unique', () => {
    const names = Object.values(themes).map(t => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  test('all theme accent colors are unique', () => {
    const accents = Object.values(themes).map(t => t.ui.accent);
    const unique = new Set(accents);
    expect(unique.size).toBe(accents.length);
  });

  test('all theme backgrounds are unique', () => {
    const bgs = Object.values(themes).map(t => t.ui.bg);
    const unique = new Set(bgs);
    expect(unique.size).toBe(bgs.length);
  });
});

// ── Contrast sanity ───────────────────────────────────────────────────────────
describe('theme contrast sanity', () => {
  Object.entries(themes).forEach(([key, theme]) => {
    test(`${key} — accent differs from background`, () => {
      expect(theme.ui.accent).not.toBe(theme.ui.bg);
    });

    test(`${key} — active color differs from default bar color`, () => {
      expect(theme.colors.active).not.toBe(theme.colors.default);
    });

    test(`${key} — compare color differs from active color`, () => {
      expect(theme.colors.compare).not.toBe(theme.colors.active);
    });

    test(`${key} — sorted color differs from default color`, () => {
      expect(theme.colors.sorted).not.toBe(theme.colors.default);
    });
  });
});

// ── Individual theme spot checks ──────────────────────────────────────────────
describe('individual theme spot checks', () => {
  test('cyberpunk has cyan accent', () => {
    expect(themes.cyberpunk.ui.accent).toBe('#00ffcc');
  });

  test('matrix has green accent', () => {
    expect(themes.matrix.ui.accent).toBe('#00ff41');
  });

  test('synthwave has magenta accent', () => {
    expect(themes.synthwave.ui.accent).toBe('#ff00ff');
  });

  test('void has white accent', () => {
    expect(themes.void.ui.accent).toBe('#ffffff');
  });

  test('arctic has light background', () => {
    // light themes have bg starting with #f
    expect(themes.arctic.ui.bg.startsWith('#f')).toBe(true);
  });

  test('mint has light background', () => {
    expect(themes.mint.ui.bg.startsWith('#f')).toBe(true);
  });

  test('dark themes have dark backgrounds', () => {
    const darkThemes = ['cyberpunk', 'matrix', 'synthwave', 'bloodmoon', 'ocean', 'lava', 'sandstorm', 'void'];
    darkThemes.forEach(key => {
      // dark bg hex values start with #0 or #1
      const bg = themes[key].ui.bg;
      expect(bg.startsWith('#0') || bg.startsWith('#1')).toBe(true);
    });
  });
});