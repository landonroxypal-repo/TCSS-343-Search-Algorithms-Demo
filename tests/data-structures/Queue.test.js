import { Queue } from "../../src/data-structures/Queue.js";

// Same enqueue/dequeue/isEmpty interface as PriorityQueue (Unify Interfaces
// with Adapter), so callers can't tell them apart.
describe("Queue", () => {
  test("is empty when freshly constructed", () => {
    const queue = new Queue();
    expect(queue.isEmpty()).toBe(true);
  });

  test("is not empty after an enqueue", () => {
    const queue = new Queue();
    queue.enqueue("a");
    expect(queue.isEmpty()).toBe(false);
  });

  test("dequeue on an empty queue returns null", () => {
    const queue = new Queue();
    expect(queue.dequeue()).toBeNull();
  });

  test("dequeue returns the id of the only entry present", () => {
    const queue = new Queue();
    queue.enqueue("a");
    expect(queue.dequeue()).toBe("a");
  });

  test("dequeue removes the returned entry from the queue", () => {
    const queue = new Queue();
    queue.enqueue("a");
    expect(queue.isEmpty()).toBe(false);
    queue.dequeue();
    expect(queue.isEmpty()).toBe(true);
  });

  test("dequeue returns entries in first-in-first-out order", () => {
    const queue = new Queue();
    queue.enqueue("a");
    queue.enqueue("b");
    queue.enqueue("c");

    expect(queue.dequeue()).toBe("a");
    expect(queue.dequeue()).toBe("b");
    expect(queue.dequeue()).toBe("c");
    expect(queue.dequeue()).toBeNull();
  });
});
