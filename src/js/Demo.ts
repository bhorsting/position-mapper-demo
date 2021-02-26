import { renderEventBus, renderEventManager } from './preview-logic/PreviewLogic';
import { PreviewRequestEvent } from './preview-logic/events/PreviewRequestEvent';
import { IRenderSettings, PREVIEW_TYPES } from './preview-logic/events/IPreviewRequestData';
import { EventTypes } from './preview-logic/events/EventTypes';
import { PreviewResponseEvent } from './preview-logic/events/PreviewResponseEvent';
import { ThreeDeeInitEvent } from './preview-logic/events/ThreeDeeInitEvent';

export const renderSettingsMock: IRenderSettings = {
  useCrop: false,
  fakeWhite: false,
  hasEditorBackground: false,
  hasShineLayer: false,
  hasThumbnail: false,
  shineColor: 123456,
};

export class Demo {
  constructor() {
    console.log('Render event manager up on', renderEventManager);
    const demoSvg: SVGSVGElement = <any>document.getElementById('svg2');
    console.log('Found SVG at', demoSvg);
    renderEventBus.addEventListener(
      EventTypes[EventTypes.PREVIEW_RESPONSE],
      this.handleResponse.bind(this)
    );
    renderEventBus.dispatchEvent(
      new ThreeDeeInitEvent({
        baseUrl: 'assets/previewsets/',
      })
    );
    renderEventBus.dispatchEvent(
      new PreviewRequestEvent({
        previewType: PREVIEW_TYPES.TWO_D,
        size: {
          x: 1080,
          y: 1080,
        },
        renderSettings: renderSettingsMock,
        renderData: {
          svgNode: demoSvg,
          productPartName: 'FRONT',
          customerCreatedContentId: 1,
        },
      })
    );
  }
  private handleResponse(e: PreviewResponseEvent) {
    console.log(e);
    switch (e.eventData.type) {
      case PREVIEW_TYPES.TWO_D:
        console.log('2D preview is ready!');
        (<any>document).getElementById('image2d').src = e.eventData.image;
        renderEventBus.dispatchEvent(
          new PreviewRequestEvent({
            previewType: PREVIEW_TYPES.THREE_D,
            renderData: {
              previewSetId: 2,
              previewImage: e.eventData.image,
              size: { x: 1080, y: 1080 },
              customerCreatedContentId: 1,
              sideName: 'FRONT',
            },
          })
        );
        break;
      case PREVIEW_TYPES.THREE_D:
        console.log('3D preview is ready!');
        (<any>document).getElementById('image3d').src = e.eventData.image;
        break;
    }
  }
}
