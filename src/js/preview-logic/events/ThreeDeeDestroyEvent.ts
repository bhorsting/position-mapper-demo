import { IEvent } from './IEvent';
import { EventTypes } from './EventTypes';
import { IThreeDeeInitData } from './IThreeDeeInitData';

export class ThreeDeeDestroyEvent implements IEvent<IThreeDeeInitData> {
  constructor() {}

  public get type() {
    return EventTypes[EventTypes.THREE_D_DESTROY];
  }
}
