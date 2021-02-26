import {
  IPreviewRequestData,
  IThreeDeeRenderData,
  ITwoDeeRenderData,
  PREVIEW_TYPES,
} from './events/IPreviewRequestData';
import { ThreeDeeRenderer } from './renderers/3d/ThreeDeeRenderer';
import { TwoDeeRenderer } from './renderers/2d/TwoDeeRenderer';
import { WebGLContextLostEvent } from './events/WebGLContextLostEvent';
import { ThreeDeeInitEvent } from './events/ThreeDeeInitEvent';
import { PreviewErrorEvent } from './events/PreviewErrorEvent';
import { IPreviewResponseData } from './events/IPreviewResponseData';
import { EventTypes } from './events/EventTypes';
import { PreviewRequestEvent } from './events/PreviewRequestEvent';
import { RenderEventBus } from './RenderEventBus';
import { PreviewResponseEvent } from './events/PreviewResponseEvent';
import { Cache } from './helpers/Cache';

const BUFFER_FOR_CACHE: number = 10;

export class RenderManager {
  private twoDeeRenderer: TwoDeeRenderer;
  private threeDeeRenderer: ThreeDeeRenderer;
  private cache: Cache<IPreviewResponseData>;
  private queue: string[] = [];
  private previewStorageEnabled: boolean;

  constructor(private eventBus: RenderEventBus) {
    this.init();
  }

  private init() {
    this.twoDeeRenderer = new TwoDeeRenderer();
    this.cache = new Cache<IPreviewResponseData>(BUFFER_FOR_CACHE);
    this.eventBus.addEventListener(
      EventTypes[EventTypes.ENABLE_PREVIEW_STORAGE],
      this.handleEnablePreviewStorage.bind(this)
    );
    this.eventBus.addEventListener(
      EventTypes[EventTypes.THREE_D_INIT],
      this.handle3DPreviewInit.bind(this)
    );
    this.eventBus.addEventListener(
      EventTypes[EventTypes.THREE_D_DESTROY],
      this.handle3DPreviewDestroy.bind(this)
    );
    this.eventBus.addEventListener(
      EventTypes[EventTypes.PREVIEW_REQUEST],
      this.handlePreviewRequest.bind(this)
    );
  }

  private static createHash(eventData: IPreviewRequestData): string {
    const eventDataTemp = JSON.parse(JSON.stringify(eventData));
    if (eventData.renderData) {
      const { svgNode } = <ITwoDeeRenderData>eventData.renderData;
      if (svgNode) {
        eventDataTemp.renderData.svgNode = new XMLSerializer().serializeToString(svgNode);
      }
    }
    return JSON.stringify(eventDataTemp);
  }

  private isInQueue(hash: string): boolean {
    return this.queue.indexOf(hash) > -1;
  }

  private addToQueue(hash: string) {
    this.queue.push(hash);
  }

  private removeFromQueue(hash: string) {
    const { queue } = this;
    queue.splice(queue.indexOf(hash), 1);
  }

  private handleEnablePreviewStorage() {
    console.log('Enabling preview local storage...');
    this.previewStorageEnabled = true;
  }

  private handleWebGlContextLost(e: Event) {
    e.preventDefault();
    this.eventBus.dispatchEvent(new WebGLContextLostEvent());
  }

  private handle3DPreviewDestroy(e: ThreeDeeInitEvent) {
    console.log('handle3DPreviewDestroy', e);
  }

  private handle3DPreviewInit(e: ThreeDeeInitEvent) {
    this.threeDeeRenderer = new ThreeDeeRenderer(e.eventData);
  }

  private async handlePreviewRequest(e: PreviewRequestEvent): Promise<void> {
    const { eventData } = e;
    const { previewType } = eventData;
    const hash = RenderManager.createHash(<IPreviewRequestData>eventData);
    const cachedResult = this.cache.get(hash);

    if (this.isInQueue(hash)) {
      return null;
    }
    this.addToQueue(hash);

    try {
      let responseData: IPreviewResponseData;

      if (cachedResult) {
        responseData = cachedResult;
      } else {
        if (previewType === PREVIEW_TYPES.TWO_D) {
          responseData = await this.getTwoDeePreview(eventData);
          this.cache.put(hash, responseData);
        } else if (previewType === PREVIEW_TYPES.THREE_D) {
          responseData = await this.getThreeDeePreview(eventData);
          this.cache.put(hash, responseData);
        }
      }

      responseData.silent = eventData.silent;

      this.removeFromQueue(hash);
      this.eventBus.dispatchEvent(new PreviewResponseEvent(responseData));
    } catch (e) {
      this.eventBus.dispatchEvent(new PreviewErrorEvent(e));
    }
  }

  private async getTwoDeePreview(requestData: IPreviewRequestData): Promise<IPreviewResponseData> {
    try {
      const renderData = <ITwoDeeRenderData>requestData.renderData;
      const renderResult = await this.twoDeeRenderer.render(renderData.svgNode, requestData.size);

      return Promise.resolve({
        productPartName: renderData.productPartName,
        image: renderResult.imageUrl,
        type: PREVIEW_TYPES.TWO_D,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  private async getThreeDeePreview(eventData: IPreviewRequestData): Promise<IPreviewResponseData> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { previewImage, previewSetId, customerCreatedContentId, sideName, size } = <
      IThreeDeeRenderData
    >eventData.renderData;
    const data2D: string = (<IThreeDeeRenderData>eventData.renderData).previewImage;
    const resultImage: string = await this.threeDeeRenderer.render(
      size,
      data2D,
      previewSetId,
      false,
      customerCreatedContentId,
      sideName
    );
    return {
      image: resultImage,
      type: PREVIEW_TYPES.THREE_D,
    };
  }
}
