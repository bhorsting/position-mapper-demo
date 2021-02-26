import { IEvent } from './IEvent';
import { IPreviewRequestData } from './IPreviewRequestData';
import { EventTypes } from './EventTypes';

export class PreviewRequestEvent implements IEvent<IPreviewRequestData> {
  constructor(public eventData: IPreviewRequestData) {}

  public get type() {
    return EventTypes[EventTypes.PREVIEW_REQUEST];
  }
}
