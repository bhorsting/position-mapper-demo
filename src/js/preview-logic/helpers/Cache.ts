export interface ICacheItem<T> {
  hash: string;
  data: T;
}

export class Cache<T> {
  private cache: ICacheItem<T>[] = [];

  constructor(private cacheBuffer: number) {}

  public put(hash: string, data: T): void {
    const cache = this.cache;
    cache.unshift({ hash, data });
    cache.length = this.cacheBuffer;
  }

  public get(hash: string): T {
    let cacheIndex: number;
    const cache = this.cache;
    cache.some((cacheItem, index) => {
      if (hash === cacheItem.hash) {
        cacheIndex = index;
        return true;
      }
      return false;
    });

    return (cache[cacheIndex] && cache[cacheIndex].data) || null;
  }
}
