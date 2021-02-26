import { PositionMapper } from '../PositionMapper';
import { PositionMapperWebGl } from '../PositionMapperWebGl';

export enum ThreeDLayerType {
  ALPHA_CUTOUT = 'ALPHA_CUTOUT',
  MULTIPLY = 'MULTIPLY',
}

export interface IThreeDAnimation {
  frames: number;
  currentFrame: number;
}

export interface IThreeDLayer {
  id: string;
  name: string;
  type: string;
}

export interface IThreeDScene {
  name: string;
  numberOfTiles: number;
  hasEditorBackground: boolean;
  whiteIsTransparent: boolean;
  //Future
  animation: IThreeDAnimation;
  layers: IThreeDLayer[];
  //Testing
  shineCutout: boolean;
  shineColor: number;
  useCrop: boolean;
}

export interface IThreeDRenderSet {
  htmlElement: HTMLElement;
  canvasElement: HTMLCanvasElement;
  renderer: PositionMapper | PositionMapperWebGl;
}

export interface IPoint {
  x: number;
  y: number;
}

export interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IRender3DSettings {
  size: IPoint;
  baseUrl: string;
}

export interface IPositionMapperViewWebGLSettings {
  vertexShaderPath: string;
  fragmentShaderPath: string;
}

export interface IWebGLRenderLayer {
  texture: WebGLTexture;
  canvas: HTMLCanvasElement;
  contentTexture: WebGLTexture;
  index: number;
  id: string;
  textureUnit: number;
  contentTextureUnit: number;
}
