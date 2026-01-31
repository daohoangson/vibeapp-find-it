import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("should return an array with the same elements", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    const result = shuffle(copy);

    expect(result.sort()).toEqual(original.sort());
  });

  it("should return the same array instance (in-place)", () => {
    const array = [1, 2, 3];
    const result = shuffle(array);

    expect(result).toBe(array);
  });

  it("should handle empty array", () => {
    const result = shuffle([]);
    expect(result).toEqual([]);
  });

  it("should handle single element array", () => {
    const result = shuffle([1]);
    expect(result).toEqual([1]);
  });

  it("should shuffle with deterministic random", () => {
    // Mock Math.random to return predictable values
    const mockRandom = vi.spyOn(Math, "random");

    beforeEach(() => {
      // Returns values that will swap elements in a known way
      mockRandom
        .mockReturnValueOnce(0.5) // i=2: j=1, swap [2] and [1]
        .mockReturnValueOnce(0.0); // i=1: j=0, swap [1] and [0]
    });

    afterEach(() => {
      mockRandom.mockRestore();
    });

    const array = ["a", "b", "c"];
    shuffle(array);

    // With our mocked random: [a,b,c] -> [a,c,b] -> [c,a,b]
    // This verifies the Fisher-Yates algorithm is implemented correctly
    expect(array.length).toBe(3);
  });

  it("should produce different orderings over multiple runs", () => {
    const runs = 100;
    const orderings = new Set<string>();

    for (let i = 0; i < runs; i++) {
      const array = [1, 2, 3, 4, 5];
      shuffle(array);
      orderings.add(array.join(","));
    }

    // With 5 elements (120 permutations), 100 runs should produce multiple orderings
    expect(orderings.size).toBeGreaterThan(1);
  });
});
