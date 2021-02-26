import { IEvent } from './IEvent';
import { EventTypes } from './EventTypes';

export class PreviewStorageEnableEvent implements IEvent<any> {
  constructor() {}

  public get type() {
    return EventTypes[EventTypes.ENABLE_PREVIEW_STORAGE];
  }
}
