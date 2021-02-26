import { RenderEventBus } from './RenderEventBus';
import { RenderManager } from './RenderManager';

const renderEventBus: RenderEventBus = new RenderEventBus();
const renderEventManager: RenderManager = new RenderManager(renderEventBus);

export { renderEventBus, renderEventManager };
