import { Cache } from '../../helpers/Cache';
import Canvg from 'canvg';

interface IRenderResult {
  imageUrl: string;
}

const BUFFER_FOR_CACHE_IMAGES = 20;
const BUFFER_FOR_CACHE_RESULTS = 20;
export const TRANSPARENT_PNG: string =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export class TwoDeeRenderer {
  private canvasCtx: CanvasRenderingContext2D;
  private canvasElement: HTMLCanvasElement;
  private cachedImages: Cache<string>;
  private cachedResults: Cache<string>;

  constructor() {
    this.initCanvas();
    this.cachedImages = new Cache<string>(BUFFER_FOR_CACHE_IMAGES);
    this.cachedResults = new Cache<string>(BUFFER_FOR_CACHE_RESULTS);
  }

  async renderImage(img: HTMLImageElement, width: number, height: number, imageType: string) {
    return new Promise<string>((resolve) => {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      /**
       * Some browsers have latency in rendering
       * To be sure that svg has been rendered and drawn properly we wait one frame
       */
      ctx.drawImage(img, 0, 0);
      requestAnimationFrame(() => {
        resolve(canvas.toDataURL(`image/${imageType}`));
        canvas = undefined;
      });
    });
  }

  public async render(initialSvg: SVGSVGElement, size: any): Promise<IRenderResult> {
    const svgElement = <SVGSVGElement>initialSvg.cloneNode(true);
    const htmlData: string = svgElement.outerHTML;
    const cachedResult = this.cachedResults.get(htmlData);
    if (cachedResult) {
      return { imageUrl: cachedResult };
    }
    const allInvis = this.convertNodesToArray(
      svgElement.querySelectorAll('*[data-no-render="true"]')
    );
    for (const n of allInvis) {
      n.parentElement.removeChild(n);
    }
    const allImages = this.convertNodesToArray(svgElement.getElementsByTagName('image'));
    const imagesBase64Urls = await Promise.all<string>(
      allImages.map((img) => {
        const href = img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || TRANSPARENT_PNG;
        return (async () => {
          const cachedImage = this.cachedImages.get(href);
          if (cachedImage) {
            return cachedImage;
          }

          const imageUrl = await this.getImageBase64Url(href);
          this.cachedImages.put(href, imageUrl);
          return imageUrl;
        })();
      })
    );

    allImages.forEach((img, index) => {
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagesBase64Urls[index]);
    });

    const dataURL = `data:image/svg+xml;base64,${btoa(this.cleanSvg(svgElement))}`;
    /**
     * Safari and Edge have an issue with loading and rending have svgs that have other images inside
     * For fixing that images should be loaded and rendered physically
     */
    this.canvasElement.width = size.x;
    this.canvasElement.height = size.y;

    const renderedImageURL = await this.renderUsingCanvg(dataURL, 'image/png');
    this.cachedResults.put(htmlData, renderedImageURL);
    return { imageUrl: renderedImageURL };
  }

  private async renderUsingCanvg(dataURL: string, imageType: string): Promise<string> {
    this.canvasCtx.imageSmoothingEnabled = true;
    this.canvasCtx['webkitImageSmoothingEnabled'] = true;
    const v = await Canvg.from(this.canvasCtx, dataURL, {
      ignoreDimensions: true,
      ignoreAnimation: true,
    });
    v.resize(this.canvasElement.width, this.canvasElement.height, 'xMidYMid meet');
    await v.render();
    return this.canvasElement.toDataURL(imageType);
  }

  private initCanvas() {
    const canvasElement = document.createElement('canvas');
    canvasElement.style.visibility = 'hidden';
    document.body.appendChild(canvasElement);
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');
  }

  private loadImage(imageURL: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = (e) => {
        reject(e);
      };

      img.crossOrigin = 'Anonymous';
      img.src = imageURL;
    });
  }

  private async getImageBase64Url(imageURL: string, imageType: string = 'png'): Promise<string> {
    if (imageURL.indexOf('data:image') === 0 || imageURL.indexOf('blob:') === 0) {
      return imageURL;
    }
    const img = await this.loadImage(imageURL);
    if (typeof OffscreenCanvas === 'undefined') {
      return await this.renderImage(img, img.width, img.height, imageType);
    }
  }

  private async waitAFrame(): Promise<void> {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }

  private cleanSvg(svgElement: SVGSVGElement): string {
    return new XMLSerializer()
      .serializeToString(svgElement)
      .replace(/clip-path='url\(([^#]+)([^']+)\)'/gi, 'clip-path="url($2)"')
      .replace(/mask='url\(([^#]+)([^']+)\)'/gi, 'mask="url($2)"');
  }

  private convertNodesToArray(nodeList: HTMLCollection | NodeList): HTMLElement[] {
    return Array.prototype.slice.call(nodeList);
  }
}
