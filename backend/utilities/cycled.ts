class Cycled<T> {
  private currentArray: T[];
  private currentIndex: number;
  private listeners: ((value: T) => void)[] = [];

  constructor(inputArray: T[] = []) {
    if (!Array.isArray(inputArray)) {
      throw new Error('Input must be an array');
    }
    this.currentArray = [...inputArray];
    this.currentIndex = 0;
  }

  current(): T | undefined {
    if (this.currentArray.length === 0) return undefined;
    return this.currentArray[this.currentIndex];
  }

  next(): T | undefined {
    if (this.currentArray.length === 0) return undefined;
    this.currentIndex = (this.currentIndex + 1) % this.currentArray.length;
    this.notify();
    return this.current();
  }

  previous(): T | undefined {
    if (this.currentArray.length === 0) return undefined;
    this.currentIndex = (this.currentIndex - 1 + this.currentArray.length) % this.currentArray.length;
    this.notify();
    return this.current();
  }

  step(stepBy: number): T | undefined {
    if (this.currentArray.length === 0) return undefined;
    this.currentIndex = (this.currentIndex + stepBy + this.currentArray.length) % this.currentArray.length;
    this.notify();
    return this.current();
  }

  reversed(): IterableIterator<T> {
    return this.currentArray.slice().reverse()[Symbol.iterator]();
  }

  indexOf(element: T): number {
    return this.currentArray.indexOf(element);
  }

  getLength(): number {
    return this.currentArray.length;
  }

  remove(element: T): T | null {
    const index = this.indexOf(element);
    if (index === -1) return null;
    const removedElement = this.currentArray.splice(index, 1)[0];
    this.currentIndex = Math.min(this.currentIndex, this.currentArray.length - 1);
    this.notify();
    return removedElement;
  }

  add(element: T): void {
    this.currentArray.push(element);
    this.notify();
  }

  reset(): void {
    this.currentIndex = 0;
    this.notify();
  }

  get index(): number {
    return this.currentIndex;
  }

  public getArray(): T[] {
    return [...this.currentArray];
  }

  set index(indexValue: number) {
    if (indexValue >= 0 && indexValue < this.currentArray.length) {
      this.currentIndex = indexValue;
      this.notify();
    } else {
      throw new Error('Index out of bounds');
    }
  }

  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.currentArray.length; i++) {
      yield this.currentArray[i];
    }
  }

  *entries(): Iterator<[number, T]> {
    for (let i = 0; i < this.currentArray.length; i++) {
      yield [i, this.currentArray[i]];
    }
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.currentArray.find(predicate);
  }

  subscribe(listener: (value: T) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const currentValue = this.current();
    if (currentValue !== undefined) {
      this.listeners.forEach(listener => listener(currentValue));
    }
  }
}

export { Cycled };
