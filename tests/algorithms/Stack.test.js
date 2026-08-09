import { Stack } from "../../src/algorithms/Stack.js";

// Same enqueue/dequeue/isEmpty interface as PriorityQueue (Unify Interfaces
// with Adapter), so callers can't tell them apart.
describe("Stack", () => {
  test("is empty when freshly constructed", () => {
    const stack = new Stack();
    expect(stack.isEmpty()).toBe(true);
  });

  test("is not empty after an enqueue", () => {
    const stack = new Stack();
    stack.enqueue("a");
    expect(stack.isEmpty()).toBe(false);
  });

  test("dequeue on an empty stack returns null", () => {
    const stack = new Stack();
    expect(stack.dequeue()).toBeNull();
  });

  test("dequeue returns the id of the only entry present", () => {
    const stack = new Stack();
    stack.enqueue("a");
    expect(stack.dequeue()).toBe("a");
  });

  test("dequeue removes the returned entry from the stack", () => {
    const stack = new Stack();
    stack.enqueue("a");
    expect(stack.isEmpty()).toBe(false);
    stack.dequeue();
    expect(stack.isEmpty()).toBe(true);
  });

  test("dequeue returns entries in last-in-first-out order", () => {
    const stack = new Stack();
    stack.enqueue("a");
    stack.enqueue("b");
    stack.enqueue("c");

    expect(stack.dequeue()).toBe("c");
    expect(stack.dequeue()).toBe("b");
    expect(stack.dequeue()).toBe("a");
    expect(stack.dequeue()).toBeNull();
  });
});
