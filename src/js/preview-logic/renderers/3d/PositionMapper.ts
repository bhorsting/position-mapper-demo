/**
 * The base class for the PositionMapperView is a Canvas-based 3d renderer
 */
import { IPoint, IRectangle, IThreeDScene } from './interfaces/Interfaces';
import { BoundingBoxScan } from '../../helpers/BoundingBoxScan';

export class PositionMapper {
  public hasCrop: boolean = false;
  public useCrop: boolean = false;

  public threeDScene: IThreeDScene;

  public outerWidth: number;
  public outerHeight: number;

  public imagesLoaded: boolean;

  public interactionCanvas: HTMLCanvasElement;

  protected width: number;
  protected height: number;

  protected contentWidth: number;
  protected contentHeight: number;

  protected contentData: ImageData;

  protected texData8: number[];

  protected sceneCanvas: HTMLCanvasElement;
  protected positionCanvas: HTMLCanvasElement;
  protected contentCanvas: HTMLCanvasElement;
  protected metaCanvas: HTMLCanvasElement;
  protected resultCanvas: HTMLCanvasElement;

  protected sceneContext: CanvasRenderingContext2D;
  protected positionContext: CanvasRenderingContext2D;

  public contentContext: CanvasRenderingContext2D;

  protected metaContext: CanvasRenderingContext2D;
  protected resultContext: CanvasRenderingContext2D;

  protected renderRectangle: IRectangle;

  protected textureInputCanvas: HTMLCanvasElement;

  protected layerCanvasArray: HTMLCanvasElement[];
  protected layerContentFileNames: string[];

  protected oversampling: number;

  private sceneData: ImageData;
  private resultData: ImageData;
  private metaData: ImageData;
  private sceneData8: number[];
  private resultData8: number[];
  private originalData8: number[];
  private metaData8: number[];

  private boundingBoxScan: BoundingBoxScan = new BoundingBoxScan();

  private texStart: number;
  private texEnd: number;

  private texBuffer: ArrayBuffer;

  // @ts-ignore
  private initSettings: {
    baseUrl: string;
    texture: any;
    posUrl: string;
    reflectionMapUrl: string;
    interactionCanvas: any;
    layerCanvasArray: HTMLCanvasElement[];
    layerContentFileNames: string[];
  };

  constructor(width: number, height: number, scene: IThreeDScene, oversampling: number = 1) {
    console.log(`Starting a PositionMapperView with size ${width},${height} @${oversampling}x`);
    this.oversampling = oversampling;
    this.threeDScene = scene;
    this.useCrop = scene.useCrop;
    this.contentWidth = this.width = this.outerWidth = width;
    this.contentHeight = this.height = this.outerHeight = height;
  }

  public getRenderedSize() {
    if (this.useCrop && this.renderRectangle) {
      return {
        width: this.renderRectangle.width,
        height: this.renderRectangle.height,
      };
    } else {
      return {
        width: this.width,
        height: this.height,
      };
    }
  }

  public setRenderRectangleAndCrop(rect: IRectangle): void {
    this.hasCrop = true;
    this.renderRectangle = rect;
    this.resultCanvas.width = rect.width;
    this.resultCanvas.height = rect.height;
  }

  public updateLayerCanvasArray(ar: HTMLCanvasElement[]): void {
    this.layerCanvasArray = ar;
  }

  public load(
    baseImageUrl: string,
    textureUrl: string,
    positionUrl: string,
    reflectionMapUrl: string,
    interactionCanvas: HTMLCanvasElement,
    layerCanvasArray: HTMLCanvasElement[],
    layerContentFileNames: string[]
  ): Promise<any> {
    this.initSettings = {
      baseUrl: baseImageUrl,
      texture: textureUrl,
      posUrl: positionUrl,
      reflectionMapUrl: reflectionMapUrl,
      interactionCanvas: interactionCanvas,
      layerCanvasArray: layerCanvasArray,
      layerContentFileNames: layerContentFileNames,
    };
    this.reset();
    this.textureInputCanvas = undefined;
    this.interactionCanvas = interactionCanvas;
    this.layerCanvasArray = layerCanvasArray;
    this.layerContentFileNames = layerContentFileNames;
    return Promise.all([
      this.createImage(baseImageUrl, this.sceneContext),
      this.createImage(textureUrl, this.contentContext, true, false),
      this.createImage(positionUrl, this.positionContext, false),
      this.createImage(reflectionMapUrl, this.metaContext),
    ]).then(() => {
      this.getImageData();
      this.getStartEndPoint();
      this.threeDScene = this.parsePositionMetaData(this.threeDScene);
      this.renderInteractive();
      return (this.imagesLoaded = true);
    });
  }

  public async loadCanvas(
    baseImageUrl: string,
    texCanvas: HTMLCanvasElement,
    positionUrl: string,
    reflectionMapUrl: string,
    interactionCanvas: HTMLCanvasElement,
    layerCanvasArray: HTMLCanvasElement[],
    layerContentFileNames: string[]
  ): Promise<any> {
    this.initSettings = {
      baseUrl: baseImageUrl,
      texture: texCanvas,
      posUrl: positionUrl,
      reflectionMapUrl: reflectionMapUrl,
      interactionCanvas: interactionCanvas,
      layerCanvasArray: layerCanvasArray,
      layerContentFileNames: layerContentFileNames,
    };
    this.reset();
    this.textureInputCanvas = texCanvas;
    this.interactionCanvas = interactionCanvas;
    this.layerCanvasArray = layerCanvasArray;
    this.layerContentFileNames = layerContentFileNames;

    await this.createImage(baseImageUrl, this.sceneContext);
    await this.createImage(positionUrl, this.positionContext, false);
    await this.createImage(reflectionMapUrl, this.metaContext);
    this.contentContext.drawImage(this.textureInputCanvas, 0, 0, this.width, this.height);
    this.getImageData();
    this.getStartEndPoint();
    this.threeDScene = this.parsePositionMetaData(this.threeDScene);
    this.forceUpdate();
    this.imagesLoaded = true;
  }

  public parsePositionMetaData(inputData: IThreeDScene): IThreeDScene {
    const info: ImageData = this.positionContext.getImageData(0, 0, 3, 1);
    const flags: number = info.data[2];
    const shineColor: number = (info.data[4] << 16) + (info.data[5] << 8) + info.data[6];

    const out = {
      name: inputData.name,
      numberOfTiles: inputData.numberOfTiles,
      hasEditorBackground: inputData.hasEditorBackground,
      whiteIsTransparent: !!(flags & 0b00000001),
      // Future
      animation: inputData.animation,
      layers: inputData.layers,
      // Testing
      shineCutout: !!(flags & 0b00000010),
      shineColor: shineColor,
      useCrop: inputData.useCrop,
    };
    // Overrides
    if (inputData.whiteIsTransparent === true) {
      out.whiteIsTransparent = true;
    }
    console.log('Parsed position metadata:');
    console.log(out);
    return out;
  }

  public setupLayers(): void {
    throw new Error('setupLayers not yet implemented for PositionMapperView (Canvas)');
  }

  public renderInteractive(): void {
    if (!this.textureInputCanvas) {
      return;
    }
    this.contentData = this.textureInputCanvas
      .getContext('2d')
      .getImageData(0, 0, this.width, this.height);
    this.texData8 = <any>this.contentData.data;
    // (<any>this.resultData8).set(this.originalData8, 0, this.originalData8.length );
    this.resultContext.clearRect(0, 0, this.outerWidth, this.outerHeight);
    this.render();
  }

  public reset(): void {
    this.imagesLoaded = false;

    if (!this.texStart) {
      this.texStart = -1;
      this.texEnd = -1;
    }

    if (!this.positionCanvas) {
      this.positionCanvas = <HTMLCanvasElement>document.createElement('canvas');
      this.resultCanvas = <HTMLCanvasElement>document.createElement('canvas');
      this.contentCanvas = <HTMLCanvasElement>document.createElement('canvas');
      this.sceneCanvas = <HTMLCanvasElement>document.createElement('canvas');
      this.metaCanvas = <HTMLCanvasElement>document.createElement('canvas');
      this.positionContext = this.positionCanvas.getContext('2d');
      this.resultContext = this.resultCanvas.getContext('2d');
      this.contentContext = this.contentCanvas.getContext('2d');
      this.sceneContext = this.sceneCanvas.getContext('2d');
      this.metaContext = this.metaCanvas.getContext('2d');
    }

    [this.positionCanvas, this.contentCanvas, this.metaCanvas].forEach((e: HTMLCanvasElement) => {
      e.width = this.width;
      e.height = this.height;
    });

    if (this.hasCrop) {
      this.resultCanvas.width = this.renderRectangle.width;
      this.resultCanvas.height = this.renderRectangle.height;
    } else {
      this.resultCanvas.width = this.outerWidth;
      this.resultCanvas.height = this.outerHeight;
    }
  }

  public render(): void {
    const w: number = this.width;
    const h: number = this.height;
    const texData8: number[] = this.texData8;
    const data8: number[] = this.sceneData8;
    const cresultData8: number[] = this.resultData8;
    const originalData8: number[] = this.originalData8;
    const refData8: number[] = this.metaData8;
    const max: number = this.texEnd;
    let r: number;
    let g: number;
    let b: number;
    let a: number;
    let a2: number;
    let s: number;
    let r2: number;
    let g2: number;
    let b2: number;
    let intval: number;
    let uvX: number;
    let uvY: number;
    let index: number;
    let ptr: number = this.texStart;
    while (ptr < max) {
      // Get position

      s = refData8[ptr + 1]; // Sample the green channel for specular highlights
      a = refData8[ptr + 2]; // Sample the blue channel for alpha and blur

      if (a !== 0) {
        a2 = 255 - a;

        r = data8[ptr];
        g = data8[ptr + 1];
        b = data8[ptr + 2];

        intval = (r << 16) | (g << 8) | b;

        uvX = (w * (intval & 0x000fff)) >>> 12;
        uvY = (h * ((intval >>> 12) & 0x000fff)) >>> 12;

        index = (uvY * w + uvX) << 2;

        r = texData8[index];
        g = texData8[index + 1];
        b = texData8[index + 2];

        r2 = originalData8[ptr];
        g2 = originalData8[ptr + 1];
        b2 = originalData8[ptr + 2];

        cresultData8[ptr] = ((r2 * a2 + ((r2 * r * a) >> 8)) >> 8) + s;
        cresultData8[ptr + 1] = ((g2 * a2 + ((g2 * g * a) >> 8)) >> 8) + s;
        cresultData8[ptr + 2] = ((b2 * a2 + ((b2 * b * a) >> 8)) >> 8) + s;
      }
      // lossy render quality
      ptr += 4;
    }
    if (this.hasCrop) {
      this.resultContext.putImageData(
        this.resultData,
        0,
        0,
        this.renderRectangle.x,
        this.renderRectangle.y,
        this.renderRectangle.width,
        this.renderRectangle.height
      );
    } else {
      this.resultContext.putImageData(
        this.resultData,
        ((this.outerWidth - this.width) / 2) | 0,
        ((this.outerHeight - this.height) / 2) | 0
      );
    }
  }

  public getPositionAt(x: number, y: number): IPoint {
    x -= (this.outerWidth - this.width) / 2;
    y -= (this.outerHeight - this.height) / 2;
    x |= 0;
    y |= 0;
    const index: number = (y * this.width + x) * 4;
    if (index < this.sceneData8.length && this.sceneData8[index + 3] !== 0) {
      const r: number = this.sceneData8[index];
      const g: number = this.sceneData8[index + 1];
      const b: number = this.sceneData8[index + 2];
      const intval: number = (r << 16) | (g << 8) | b;
      return { x: (intval & 0x000fff) / 4096, y: ((intval >>> 12) & 0x000fff) / 4096 };
    } else {
      return undefined; // Not found
    }
  }

  public getResultCanvas(): HTMLCanvasElement {
    return this.resultCanvas;
  }

  public getCropCanvas(): HTMLCanvasElement {
    return this.resultCanvas;
  }

  public forceUpdate(): void {
    this.render();
  }

  protected getImageData(): void {
    this.resultContext.drawImage(this.sceneCanvas, 0, 0);
    this.sceneData = this.positionContext.getImageData(0, 0, this.width, this.height);
    this.contentData = this.contentContext.getImageData(0, 0, this.width, this.height);
    this.resultData = this.resultContext.getImageData(0, 0, this.width, this.height);
    this.metaData = this.metaContext.getImageData(0, 0, this.width, this.height);
    this.texData8 = <any>this.contentData.data;
    this.sceneData8 = <any>this.sceneData.data;
    this.resultData8 = <any>this.resultData.data;
    this.metaData8 = <any>this.metaData.data;
    this.texBuffer = new ArrayBuffer(this.resultData8.length);
    this.originalData8 = <any>new Uint8Array(this.texBuffer);
    (<any>this.originalData8).set(this.resultData8, 0, this.resultData8.length);
    if (this.useCrop) {
      this.renderRectangle = this.boundingBoxScan.scan(
        this.metaData,
        BoundingBoxScan.MAX_SCAN_BLOCK_SIZE,
        BoundingBoxScan.SCAN_OFFSET_RED
      );
      this.hasCrop = !!this.renderRectangle;
      if (this.hasCrop) {
        this.resultCanvas.width = this.renderRectangle.width;
        this.resultCanvas.height = this.renderRectangle.height;
      }
    } else {
      this.hasCrop = false;
    }
  }

  protected fitImageOn(canvas: HTMLCanvasElement, imageObj: HTMLImageElement) {
    const imageAspectRatio = imageObj.width / imageObj.height;
    const canvasAspectRatio = canvas.width / canvas.height;
    let renderableHeight: number;
    let renderableWidth: number;

    /*
     * If image's aspect ratio is less than canvas's we fit on height
     * and place the image centrally along width
     */
    if (imageAspectRatio < canvasAspectRatio) {
      renderableHeight = canvas.height;
      renderableWidth = Math.min(imageObj.width * (renderableHeight / imageObj.height));
    } else if (imageAspectRatio > canvasAspectRatio) {
      renderableWidth = canvas.width;
      renderableHeight = Math.min(imageObj.height * (renderableWidth / imageObj.width));
    } else {
      renderableHeight = canvas.height;
      renderableWidth = canvas.width;
    }
    canvas.getContext('2d').drawImage(imageObj, 0, 0, renderableWidth, renderableHeight);
  }

  public createImage(
    imageUrl: string,
    ctx: CanvasRenderingContext2D,
    smoothing: boolean = false,
    fitOnSquare: boolean = false
  ): Promise<any> {
    ctx.canvas.width = this.width;
    ctx.canvas.height = this.height;

    const p: Promise<any> = new Promise((resolve: Function, reject: Function) => {
      const img: HTMLImageElement = <HTMLImageElement>document.createElement('img');
      if (fitOnSquare) {
        // eslint-disable-next-line no-multi-assign
        ctx.canvas.width = ctx.canvas.height = 2048;
      } else {
        img.width = this.width;
        img.height = this.height;
      }
      img.onload = () => {
        if (ctx.imageSmoothingEnabled !== undefined) {
          ctx.imageSmoothingEnabled = smoothing;
        }
        if (fitOnSquare) {
          console.log('Fitting image on square canvas');
          this.fitImageOn(ctx.canvas, img);
        } else {
          ctx.drawImage(img, 0, 0, this.width, this.height);
        }
        resolve(ctx);
        img.onload = undefined;
        img.onerror = undefined;
      };
      img.onerror = (e: any) => {
        console.log(`Error loading image ${img.src}`, e);
        reject(undefined);
        img.onload = undefined;
        img.onerror = undefined;
      };
      img.src = imageUrl;
    });
    return p;
  }

  private getStartEndPoint(): void {
    const w: number = this.width;
    const h: number = this.height;
    let a: number;
    const data8: number[] = this.metaData8;
    let ptr: number = 0;
    const max: number = w * h * 4;
    let minVal: number = -1;
    let maxVal: number = -1;
    while (ptr < max) {
      // Get position
      a = data8[ptr + 1];
      if (a !== 0) {
        if (minVal === -1) {
          minVal = ptr;
        } else {
          maxVal = ptr;
        }
      }
      ptr += 4;
    }
    this.texStart = minVal;
    this.texEnd = maxVal;
    console.log('start,end', minVal, maxVal);
  }
}
