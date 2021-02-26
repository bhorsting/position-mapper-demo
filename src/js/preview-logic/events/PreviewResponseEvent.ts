import { IEvent } from './IEvent';
import { IPreviewResponseData } from './IPreviewResponseData';
import { EventTypes } from './EventTypes';

export class PreviewResponseEvent implements IEvent<IPreviewResponseData> {
  constructor(public eventData: IPreviewResponseData) {}

  public get type() {
    return EventTypes[EventTypes.PREVIEW_RESPONSE];
  }
}
