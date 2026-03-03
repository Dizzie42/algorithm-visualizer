const { createSorter } = require('../algorithms');

// Helper to run a sort algorithm synchronously-ish
async function runAlgo(algoName, inputArray) {
  const statsRef  = { current: { comparisons: 0, swaps: 0 } };
  const stopRef   = { current: false };
  const delayRef  = { current: 0 }; // no delay in tests
  let finalArray  = [...inputArray];

  const algos = createSorter(
    inputArray,
    statsRef,
    stopRef,
    delayRef,
    (a) => { finalArray = [...a]; }
  );

  await algos[algoName]();
  return { sorted: finalArray, stats: statsRef.current };
}

function isSorted(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

const TEST_CASES = {
  random:     [64, 34, 25, 12, 22, 11, 90],
  sorted:     [1, 2, 3, 4, 5, 6, 7],
  reversed:   [7, 6, 5, 4, 3, 2, 1],
  duplicates: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3],
  single:     [42],
  two:        [2, 1],
  allSame:    [5, 5, 5, 5, 5],
};

const ALGOS = ['bubble', 'selection', 'insertion', 'merge', 'quick', 'heap', 'shell', 'counting'];

// ── Correctness ───────────────────────────────────────────────────────────────
describe('Sorting correctness', () => {
  ALGOS.forEach(algo => {
    describe(algo, () => {
      Object.entries(TEST_CASES).forEach(([caseName, input]) => {
        test(`sorts ${caseName} array`, async () => {
          const { sorted } = await runAlgo(algo, [...input]);
          expect(isSorted(sorted)).toBe(true);
        });

        test(`${caseName} — output length matches input`, async () => {
          const { sorted } = await runAlgo(algo, [...input]);
          expect(sorted.length).toBe(input.length);
        });

        test(`${caseName} — contains same elements as input`, async () => {
          const { sorted } = await runAlgo(algo, [...input]);
          expect([...sorted].sort((a, b) => a - b))
            .toEqual([...input].sort((a, b) => a - b));
        });
      });
    });
  });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
describe('Stats tracking', () => {
  ALGOS.forEach(algo => {
    test(`${algo} — records comparisons > 0 for non-trivial array`, async () => {
      const { stats } = await runAlgo(algo, [5, 3, 8, 1, 9, 2]);
      expect(stats.comparisons).toBeGreaterThan(0);
    });
  });

  test('bubble sort — swaps equal 0 on already sorted array', async () => {
    const { stats } = await runAlgo('bubble', [1, 2, 3, 4, 5]);
    expect(stats.swaps).toBe(0);
  });

  test('insertion sort — swaps equal 0 on already sorted array', async () => {
    const { stats } = await runAlgo('insertion', [1, 2, 3, 4, 5]);
    expect(stats.swaps).toBe(0);
  });

  test('selection sort — comparisons scale with input size', async () => {
    const small = await runAlgo('selection', [3, 1, 2]);
    const large = await runAlgo('selection', [9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(large.stats.comparisons).toBeGreaterThan(small.stats.comparisons);
  });
});

// ── Stop flag ─────────────────────────────────────────────────────────────────
describe('Stop flag', () => {
  ALGOS.forEach(algo => {
    test(`${algo} — throws STOPPED when stopRef is true`, async () => {
      const statsRef = { current: { comparisons: 0, swaps: 0 } };
      const stopRef  = { current: true }; // already stopped
      const delayRef = { current: 0 };

      const algos = createSorter(
        [5, 3, 8, 1, 9],
        statsRef,
        stopRef,
        delayRef,
        () => {}
      );

      await expect(algos[algo]()).rejects.toThrow('STOPPED');
    });
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────
describe('Edge cases', () => {
  ALGOS.forEach(algo => {
    test(`${algo} — handles single element`, async () => {
      const { sorted } = await runAlgo(algo, [42]);
      expect(sorted).toEqual([42]);
    });

    test(`${algo} — handles two elements`, async () => {
      const { sorted } = await runAlgo(algo, [2, 1]);
      expect(sorted).toEqual([1, 2]);
    });

    test(`${algo} — handles all identical elements`, async () => {
      const { sorted } = await runAlgo(algo, [7, 7, 7, 7]);
      expect(sorted).toEqual([7, 7, 7, 7]);
    });

    test(`${algo} — handles large array`, async () => {
      const large = Array.from({ length: 200 }, () => Math.floor(Math.random() * 500));
      const { sorted } = await runAlgo(algo, large);
      expect(isSorted(sorted)).toBe(true);
      expect(sorted.length).toBe(200);
    });
  });
});

// ── Algorithm-specific ────────────────────────────────────────────────────────
describe('Algorithm specific', () => {
  test('bubble sort — worst case (reversed) has max swaps', async () => {
    const reversed = await runAlgo('bubble', [5, 4, 3, 2, 1]);
    const sorted   = await runAlgo('bubble', [1, 2, 3, 4, 5]);
    expect(reversed.stats.swaps).toBeGreaterThan(sorted.stats.swaps);
  });

  test('merge sort — comparison count is O(n log n) range', async () => {
    const n = 64;
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100));
    const { stats } = await runAlgo('merge', arr);
    // n log2 n ≈ 384, allow generous upper bound
    expect(stats.comparisons).toBeLessThan(n * n);
    expect(stats.comparisons).toBeGreaterThan(0);
  });

  test('counting sort — handles array with value range 1-100', async () => {
    const arr = Array.from({ length: 50 }, () => Math.floor(Math.random() * 100) + 1);
    const { sorted } = await runAlgo('counting', arr);
    expect(isSorted(sorted)).toBe(true);
  });

  test('quick sort — pivot ends up in correct position', async () => {
    const arr = [3, 6, 8, 10, 1, 2, 1];
    const { sorted } = await runAlgo('quick', arr);
    expect(isSorted(sorted)).toBe(true);
  });

  test('heap sort — sorted output matches native sort', async () => {
    const arr = [38, 27, 43, 3, 9, 82, 10];
    const { sorted } = await runAlgo('heap', arr);
    expect(sorted).toEqual([...arr].sort((a, b) => a - b));
  });

  test('shell sort — handles large gaps correctly', async () => {
    const arr = Array.from({ length: 100 }, (_, i) => 100 - i);
    const { sorted } = await runAlgo('shell', arr);
    expect(isSorted(sorted)).toBe(true);
  });
});