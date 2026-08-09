export class PriorityQueue {
  constructor() {
    this._entries = [];
  }

  isEmpty() {
    return this._entries.length === 0;
  }

  enqueue(id, priority) {
    this._entries.push({id, priority});

    let n = this._entries.length - 1;

    while (n > 0) {
      const parent = Math.floor((n - 1) / 2);

      if (this._entries[n].priority < this._entries[parent].priority) {
        this._swapHelper(n, parent);
      }

      n = parent;
    }
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    const entry = this._entries[0].id;

    this._entries[0] = this._entries[this._entries.length - 1];
    this._entries.pop();

    let n = 0;

    while (n < this._entries.length) {
      const leftChild = 2 * n + 1;
      const rightChild = 2 * n + 2;

      if (this._entries.length > leftChild && this._entries[n].priority > this._entries[leftChild].priority) {
        this._swapHelper(n, leftChild);
        n = leftChild;
      } else if (this._entries.length > rightChild && this._entries[n].priority > this._entries[rightChild].priority) {
        this._swapHelper(n, rightChild)
        n = rightChild;
      } else {
        break;
      }
    } 

    return entry;
  }

  _swapHelper(i, j) {
    const temp = this._entries[i];
    this._entries[i] = this._entries[j];
    this._entries[j] = temp;
  }
}
