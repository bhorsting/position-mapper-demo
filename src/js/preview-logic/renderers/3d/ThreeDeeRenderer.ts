import { PreviewSetLoader } from './PreviewSetLoader';
import { PositionMapperWebGl } from './PositionMapperWebGl';
import { IThreeDeeInitData } from '../../events/IThreeDeeInitData';
import { IPoint } from './interfaces/Interfaces';

export class ThreeDeeRenderer {
  private previewSetLoader: PreviewSetLoader;
  private baseUrl: string;
  private positionMapper: PositionMapperWebGl;
  constructor(eventData: IThreeDeeInitData) {
    console.log('Started 3D renderer', eventData);
    this.baseUrl = eventData.baseUrl;
  }
  public async render(
    size: IPoint,
    image: any,
    previewSetId: number,
    useCrop: boolean = false,
    customerCreatedContentId: number,
    sideName: string
  ): Promise<string> {
    if (this.previewSetLoader) {
      await this.positionMapper.createImage(image, this.positionMapper.contentContext, true, false);
      this.positionMapper.renderUserCanvasOnly();
    } else {
      this.positionMapper = new PositionMapperWebGl(1920, 1080, {
        shineColor: undefined,
        numberOfTiles: 1,
        name: previewSetId.toString(),
        layers: [],
        hasEditorBackground: false,
        animation: null,
        shineCutout: undefined,
        useCrop: false,
        whiteIsTransparent: false,
      });
      this.previewSetLoader = new PreviewSetLoader(this.baseUrl);
      this.positionMapper.reset();
      await this.previewSetLoader.loadSet(previewSetId, image, this.positionMapper);
      this.applyCrop();
      this.positionMapper.render();
    }
    return this.positionMapper.getCropCanvas().toDataURL();
  }
  private applyCrop() {
    this.positionMapper.setRenderRectangleAndCrop({
      x: (1920 - 1080) / 2,
      y: 0,
      width: 1080,
      height: 1080,
    });
  }
  public destroy() {
    this.positionMapper.reset();
  }
}
