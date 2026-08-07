import { PriorityQueue } from "../../src/algorithms/PriorityQueue.js";

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

  test("dequeueMin on an empty queue returns null", () => {
    const queue = new PriorityQueue();
    expect(queue.dequeueMin()).toBeNull();
  });

  test("dequeueMin returns the id of the only entry present", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    expect(queue.dequeueMin()).toBe("a");
  });

  test("dequeueMin removes the returned entry from the queue", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    expect(queue.isEmpty()).toBe(false);
    queue.dequeueMin();
    expect(queue.isEmpty()).toBe(true);
  });

  test("dequeueMin returns the id with the smallest priority when priorities are already increasing", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 1);
    queue.enqueue("b", 3);
    queue.enqueue("c", 5);
    expect(queue.dequeueMin()).toBe("a");
  });

  test("dequeueMin returns the id with the smallest priority when priorities are decreasing", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    queue.enqueue("b", 3);
    queue.enqueue("c", 1);
    expect(queue.dequeueMin()).toBe("c");
  });

  test("repeated dequeueMin calls drain the queue in priority order", () => {
    const queue = new PriorityQueue();
    queue.enqueue("a", 5);
    queue.enqueue("b", 1);
    queue.enqueue("c", 3);

    expect(queue.dequeueMin()).toBe("b");
    expect(queue.dequeueMin()).toBe("c");
    expect(queue.dequeueMin()).toBe("a");
    expect(queue.dequeueMin()).toBeNull();
  });
});
