import { PriorityQueue } from "../../src/data-structures/PriorityQueue.js";

describe("PriorityQueue", () => {
  test("is empty when freshly constructed", () => {
    const queue = new PriorityQueue();
    expect(queue.isEmpty()).toBe(true);
  });

  test("is not empty after an enqueue", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    expect(queue.isEmpty()).toBe(false);
  });

  test("dequeue on an empty queue returns null", () => {
    const queue = new PriorityQueue();
    expect(queue.dequeue()).toBeNull();
  });

  test("dequeue returns the id of the only entry present", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    expect(queue.dequeue()).toBe("a");
  });

  test("dequeue removes the returned entry from the queue", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    expect(queue.isEmpty()).toBe(false);
    queue.dequeue();
    expect(queue.isEmpty()).toBe(true);
  });

  test("dequeue returns the id with the smallest priority when priorities are already increasing", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 1);
    queue.enqueue("b", 3);
    queue.enqueue("c", 5);
    expect(queue.dequeue()).toBe("a");
  });

  test("dequeue returns the id with the smallest priority when priorities are decreasing", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    queue.enqueue("b", 3);
    queue.enqueue("c", 1);
    expect(queue.dequeue()).toBe("c");
  });

  test("repeated dequeue calls drain the queue in priority order", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    queue.enqueue("b", 1);
    queue.enqueue("c", 3);

    expect(queue.dequeue()).toBe("b");
    expect(queue.dequeue()).toBe("c");
    expect(queue.dequeue()).toBe("a");
    expect(queue.dequeue()).toBeNull();
  });
});
