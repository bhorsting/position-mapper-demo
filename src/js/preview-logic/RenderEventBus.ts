import { IEvent } from './events/IEvent';

export class RenderEventBus {
  private readonly listeners: { [key: string]: Function[] };

  constructor() {
    this.listeners = {};
  }

  addEventListener(eventName: string, callback: Function) {
    const { listeners } = this;
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    if (listeners[eventName].indexOf(callback) === -1) {
      listeners[eventName].push(callback);
    }
  }

  removeEventListener(eventName: string, callback: Function) {
    const { listeners } = this;
    const callbackIndex = listeners[eventName].indexOf(callback);
    if (callbackIndex > -1) {
      listeners[eventName].splice(callbackIndex, 1);
    }
  }

  dispatchEvent(event: IEvent<any>) {
    const callBackArray: Function[] = this.listeners[event.type];
    if (callBackArray) {
      callBackArray.forEach((callback: Function) => {
        callback(event);
      });
    }
  }
}
