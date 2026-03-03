function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export function createSorter(arr, statsRef, stopRef, delayRef, onStep) {
  const a = [...arr];
  const sorted = new Set();

  async function step(hi = {}) {
    if (stopRef.current) throw new Error('STOPPED');
    onStep([...a], { ...hi }, new Set(sorted));
    if (delayRef.current > 0) await sleep(delayRef.current);
  }

  function cmp() { statsRef.current.comparisons++; }
  function sw()  { statsRef.current.swaps++; }

  const algos = {
    async bubble() {
      const n = a.length;
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          cmp(); await step({ [j]: 'compare', [j+1]: 'compare' });
          if (a[j] > a[j+1]) {
            [a[j], a[j+1]] = [a[j+1], a[j]]; sw();
            await step({ [j]: 'active', [j+1]: 'active' });
          }
        }
        sorted.add(n - 1 - i);
      }
      sorted.add(0);
    },

    async selection() {
      const n = a.length;
      for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        await step({ [i]: 'pivot' });
        for (let j = i + 1; j < n; j++) {
          cmp(); await step({ [i]: 'pivot', [minIdx]: 'active', [j]: 'compare' });
          if (a[j] < a[minIdx]) minIdx = j;
        }
        if (minIdx !== i) {
          [a[i], a[minIdx]] = [a[minIdx], a[i]]; sw();
          await step({ [i]: 'active', [minIdx]: 'active' });
        }
        sorted.add(i);
      }
      sorted.add(n - 1);
    },

    async insertion() {
      const n = a.length;
      sorted.add(0);
      for (let i = 1; i < n; i++) {
        const key = a[i];
        let j = i - 1;
        await step({ [i]: 'active' });
        while (j >= 0 && a[j] > key) {
          cmp(); a[j+1] = a[j]; sw();
          await step({ [j]: 'compare', [j+1]: 'active' });
          j--;
        }
        a[j+1] = key;
        sorted.add(i);
        await step({ [j+1]: 'active' });
      }
    },

    async merge(l = 0, r = a.length - 1) {
      if (l >= r) return;
      const m = Math.floor((l + r) / 2);
      await algos.merge(l, m);
      await algos.merge(m + 1, r);
      const left  = a.slice(l, m + 1);
      const right = a.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      while (i < left.length && j < right.length) {
        cmp(); await step({ [k]: 'active', [l+i]: 'compare', [m+1+j]: 'compare' });
        if (left[i] <= right[j]) a[k++] = left[i++];
        else { a[k++] = right[j++]; sw(); }
      }
      while (i < left.length)  { a[k++] = left[i++];  await step({ [k-1]: 'active' }); }
      while (j < right.length) { a[k++] = right[j++]; await step({ [k-1]: 'active' }); }
      for (let x = l; x <= r; x++) sorted.add(x);
    },

    async quick(lo = 0, hi = a.length - 1) {
      if (lo >= hi) return;
      const p = await algos._partition(lo, hi);
      sorted.add(p);
      await algos.quick(lo, p - 1);
      await algos.quick(p + 1, hi);
    },

    async _partition(lo, hi) {
      const pivot = a[hi];
      let i = lo - 1;
      await step({ [hi]: 'pivot' });
      for (let j = lo; j < hi; j++) {
        cmp(); await step({ [hi]: 'pivot', [j]: 'compare', ...(i >= 0 ? { [i]: 'active' } : {}) });
        if (a[j] <= pivot) {
          i++; [a[i], a[j]] = [a[j], a[i]]; sw();
          await step({ [hi]: 'pivot', [i]: 'active', [j]: 'active' });
        }
      }
      [a[i+1], a[hi]] = [a[hi], a[i+1]]; sw();
      await step({ [i+1]: 'active' });
      return i + 1;
    },

    async heap() {
      const n = a.length;
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await algos._heapify(n, i);
      for (let i = n - 1; i > 0; i--) {
        [a[0], a[i]] = [a[i], a[0]]; sw();
        sorted.add(i);
        await step({ [0]: 'active', [i]: 'compare' });
        await algos._heapify(i, 0);
      }
      sorted.add(0);
    },

    async _heapify(n, i) {
      let largest = i, l = 2*i+1, r = 2*i+2;
      statsRef.current.comparisons += 2;
      await step({ [i]: 'pivot', ...(l < n ? { [l]: 'compare' } : {}), ...(r < n ? { [r]: 'compare' } : {}) });
      if (l < n && a[l] > a[largest]) largest = l;
      if (r < n && a[r] > a[largest]) largest = r;
      if (largest !== i) {
        [a[i], a[largest]] = [a[largest], a[i]]; sw();
        await step({ [i]: 'active', [largest]: 'active' });
        await algos._heapify(n, largest);
      }
    },

    async shell() {
      const n = a.length;
      let gap = Math.floor(n / 2);
      while (gap > 0) {
        for (let i = gap; i < n; i++) {
          const temp = a[i];
          let j = i;
          while (j >= gap) {
            cmp(); await step({ [j]: 'compare', [j-gap]: 'compare' });
            if (a[j - gap] <= temp) break;
            a[j] = a[j - gap]; sw();
            await step({ [j]: 'active', [j-gap]: 'active' });
            j -= gap;
          }
          a[j] = temp;
          await step({ [j]: 'active' });
        }
        gap = Math.floor(gap / 2);
      }
      for (let i = 0; i < n; i++) sorted.add(i);
    },

    async counting() {
      const n = a.length;
      const max = Math.max(...a);
      const count = new Array(max + 1).fill(0);
      for (let i = 0; i < n; i++) {
        count[a[i]]++; cmp();
        await step({ [i]: 'compare' });
      }
      let idx = 0;
      for (let val = 0; val <= max; val++) {
        while (count[val]-- > 0) {
          a[idx] = val; sorted.add(idx); sw();
          await step({ [idx]: 'active' });
          idx++;
        }
      }
    },
  };

  return algos;
}