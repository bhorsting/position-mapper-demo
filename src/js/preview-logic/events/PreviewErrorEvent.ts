import { IEvent } from './IEvent';
import { EventTypes } from './EventTypes';
import { IPreviewErrorData } from './IPreviewErrorData';

export class PreviewErrorEvent implements IEvent<IPreviewErrorData> {
  constructor(public eventData: IPreviewErrorData) {}

  public get type() {
    return EventTypes[EventTypes.PREVIEW_ERROR];
  }
}
