import { IPreviewResponseData } from './IPreviewResponseData';
import { IPoint } from '../renderers/3d/interfaces/Interfaces';

export enum PREVIEW_TYPES {
  TWO_D,
  THREE_D,
  EMBROIDERY,
  ANIMATED_THREE_D,
}

export interface ISize {
  x: number;
  y: number;
}

export interface IRenderSettings {}

export interface IPreviewRequestData {
  size?: ISize;
  previewType: PREVIEW_TYPES;
  renderSettings?: IRenderSettings;
  renderData:
    | ITwoDeeRenderData
    | IEmbroideryRenderData
    | IAnimatedThreeDeeRenderData
    | IThreeDeeRenderData;
  silent?: boolean;
}

export interface ITwoDeeRenderData {
  svgNode: SVGSVGElement;
  productPartName: string;
  customerCreatedContentId: number;
}

export interface IAnimatedThreeDeeRenderData {
  allPartsPreviews: IPreviewResponseData[];
  previewRootElement: HTMLElement;
}

export interface IThreeDeeRenderData {
  size: IPoint;
  preview?: IPreviewResponseData;
  previewImage: string;
  previewSetId: number;
  previewRootElement?: HTMLElement;
  customerCreatedContentId: number;
  sideName: string;
}

export interface IEmbroideryRenderData {
  customerCreatedContentId: number;
  content: IEmbroideryContent;
  authToken: string;
}

export interface IEmbroideryContent {
  embroideryDesign: IEmbroideryDesign;
  views: IEmbroideryView[];
}

export interface IEmbroideryDesign {
  token: string;
  items: IEmbroideryItemsDefinition[];
}

export interface IEmbroideryItemsDefinition {
  characterHeight?: number;
  key: string;
  maximumCharacters?: number;
  text: string;
  textDistortion?: string;
  defaultText: string;
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface IEmbroideryView {
  name: string;
  sizes: ISizes[];
}

export interface ISizes {
  width: number;
  height: number;
}
