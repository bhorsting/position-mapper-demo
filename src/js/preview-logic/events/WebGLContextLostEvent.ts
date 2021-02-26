import { IEvent } from './IEvent';
import { EventTypes } from './EventTypes';
import { IThreeDeeInitData } from './IThreeDeeInitData';

export class WebGLContextLostEvent implements IEvent<IThreeDeeInitData> {
  constructor() {}

  public get type() {
    return EventTypes[EventTypes.CONTEXT_LOST];
  }
}
