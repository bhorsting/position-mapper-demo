export interface IEvent<T> {
  type: string;
  eventData?: T;
}
