import { IEvent } from './IEvent';
import { EventTypes } from './EventTypes';
import { IThreeDeeInitData } from './IThreeDeeInitData';

/**
 * Called when the 3d renderer should start initialization
 */
export class ThreeDeeInitEvent implements IEvent<IThreeDeeInitData> {
  constructor(public eventData: IThreeDeeInitData) {}

  public get type() {
    return EventTypes[EventTypes.THREE_D_INIT];
  }
}
