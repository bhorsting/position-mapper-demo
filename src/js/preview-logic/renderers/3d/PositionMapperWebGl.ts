import { WebGLUtil } from './util/WebGlUtil';
import { IThreeDLayer, IThreeDScene } from './interfaces/Interfaces';
import { FragmentShaderCompiler } from './util/FragmentShaderCompiler';
import { PositionMapper } from './PositionMapper';

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

/**
 * The WebGL version of the MS
 */
export class PositionMapperWebGl extends PositionMapper {
  public static DEBUG_POSITION_MAPPER: boolean = false;
  public settings: IPositionMapperViewWebGLSettings = {
    vertexShaderPath: 'webgl/vertex.shader.frag',
    fragmentShaderPath: 'webgl/fragment.shader.frag',
  };

  public updateTextureMapOnly: boolean = true;

  public tBase: WebGLTexture;
  public tTex: WebGLTexture;
  public tPosition: WebGLTexture;
  public tReflection: WebGLTexture;

  private gl: WebGLRenderingContext;
  private glCanvas: HTMLCanvasElement;
  private vertexShader: WebGLShader;
  private fragmentShader: WebGLShader;
  private program: WebGLProgram;

  private programMap: Map<string, WebGLProgram> = new Map();

  private hasInitialStaticRender: boolean = false;

  private tLayers: IWebGLRenderLayer[] = [];

  private resolutionLocation: WebGLUniformLocation;
  private numTilesLocation: WebGLUniformLocation;
  private debugPositionMapperLocation: WebGLUniformLocation;
  private fakeWhiteLocation: WebGLUniformLocation;

  // TEST
  private shineColorLocation: WebGLUniformLocation;
  private shineCutOutLocation: WebGLUniformLocation;
  private currentFragmentShaderSource: string;

  constructor(width: number, height: number, scene: IThreeDScene, oversampling: number = 1) {
    super(width, height, scene, oversampling);
  }

  public reset(): void {
    super.reset();
    if (!this.glCanvas) {
      this.setupWebGL();
    }
  }

  public setupLayers(): void {
    // Setup the additional layers
    const layers: IThreeDLayer[] = this.threeDScene.layers;
    let textureUnit: number = 4;

    this.tLayers = [];

    layers.forEach(async (l: IThreeDLayer, index: number) => {
      // The layer containing the mask to be applied on the content
      const layerName: string = `u_layer_${index}`;
      const layerCanvas: HTMLCanvasElement = this.layerCanvasArray[index];
      // The layer containing the image to be masked
      const layerContentName: string = `u_layer_content_${index}`;
      const layerContentCanvas: HTMLCanvasElement = document.createElement('canvas');
      layerContentCanvas.width = layerCanvas.width;
      layerContentCanvas.height = layerCanvas.height;
      await this.createImage(
        this.layerContentFileNames[index],
        layerContentCanvas.getContext('2d'),
        true
      );
      console.log('layer images loaded...');
      const layerInfo: IWebGLRenderLayer = {
        texture: this.setupTexture(layerCanvas, textureUnit, this.program, layerName),
        canvas: layerCanvas,
        contentTexture: this.setupTexture(
          layerContentCanvas,
          textureUnit + 1,
          this.program,
          layerContentName
        ),
        id: l.id,
        index: index,
        textureUnit: textureUnit,
        contentTextureUnit: textureUnit + 1,
      };
      this.tLayers.push(layerInfo);
      textureUnit += 2;
    });
  }

  public updateLayerCanvasArray(ar: HTMLCanvasElement[]): void {
    super.updateLayerCanvasArray(ar);
    let l: IWebGLRenderLayer;
    ar.forEach((c: HTMLCanvasElement) => {
      l = this.getLayerByCanvas(c);
      if (l) {
        // eslint-disable-next-line no-self-assign
        l.canvas.width = l.canvas.width; // clears the canvas
        l.canvas.getContext('2d').drawImage(c, 0, 0, c.width, c.height);
      }
    });
  }

  public renderInteractive(): void {
    if (!this.textureInputCanvas) {
      return;
    }
    this.contentContext.drawImage(this.textureInputCanvas, 0, 0, this.width, this.height);
    if (this.interactionCanvas) {
      // If needed draw the interaction canvas' output on top
      this.contentContext.drawImage(this.interactionCanvas, 0, 0, this.width, this.height);
    }
    if (this.updateTextureMapOnly && !this.hasInitialStaticRender) {
      this.render();
      this.hasInitialStaticRender = true;
    } else {
      this.renderUserCanvasOnly();
    }
  }

  public render(): void {
    console.time('render');
    // Pass in the three canvases
    this.updateTexture(0, this.sceneCanvas);
    this.updateTexture(1, this.contentCanvas);
    this.updateTexture(2, this.positionCanvas);
    this.updateTexture(3, this.metaCanvas);
    this.updateLayers();
    this.drawAndCrop();
    console.timeEnd('render');
  }

  public renderUserCanvasOnly(): void {
    console.time('renderUserCanvasOnly');
    this.updateTexture(1, this.contentCanvas);
    this.updateLayers();
    this.drawAndCrop();
    console.timeEnd('renderUserCanvasOnly');
  }

  public getResultCanvas(): HTMLCanvasElement {
    return this.glCanvas;
  }

  public getCropCanvas(): HTMLCanvasElement {
    return this.hasCrop ? this.resultCanvas : this.glCanvas;
  }

  public forceUpdate(): void {
    this.hasInitialStaticRender = false;
    this.renderInteractive();
  }

  /**
   * Creates the WebGL context
   */
  public setupWebGL(): void {
    if (!this.glCanvas) {
      this.glCanvas = document.createElement('canvas');
    }
    this.glCanvas.width = this.width;
    this.glCanvas.height = this.height;

    if (!this.gl) {
      this.gl = WebGLUtil.setupWebGL(this.glCanvas, {
        preserveDrawingBuffer: true,
        premultipliedAlpha: true,
        dontResize: true,
      });
    }

    this.glCanvas.addEventListener('webglcontextlost', () => {
      console.warn('WebGL Context lost! Restarting...');
      (<any>window).handleContextLost();
    });

    if (!this.gl) {
      throw new Error('Impossible creating WebGL context');
    }

    const fragmentShaderSource = FragmentShaderCompiler.createFragmentShader(
      this.threeDScene,
      (<HTMLScriptElement>document.getElementById('fragmentShader')).text
    );

    if (!this.vertexShader) {
      this.vertexShader = WebGLUtil.loadShader(
        this.gl,
        (<HTMLScriptElement>document.getElementById('vertexShader')).text,
        this.gl.VERTEX_SHADER
      );
    }

    if (fragmentShaderSource !== this.currentFragmentShaderSource) {
      console.log('Recompiling shaders');
      this.currentFragmentShaderSource = fragmentShaderSource;
      this.fragmentShader = WebGLUtil.loadShader(
        this.gl,
        fragmentShaderSource,
        this.gl.FRAGMENT_SHADER
      );
      this.program = this.programMap.get(fragmentShaderSource);
      if (!this.program) {
        this.program = WebGLUtil.loadProgram(this.gl, [this.vertexShader, this.fragmentShader]);
        this.programMap.set(fragmentShaderSource, this.program);
      }
      this.gl.useProgram(this.program);
      // look up where the vertex data needs to go.
      const positionLocation: number = this.gl.getAttribLocation(this.program, 'a_position');
      const texCoordLocation: number = this.gl.getAttribLocation(this.program, 'a_texCoord');

      // provide texture coordinates for the rectangle.
      const texCoordBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
        this.gl.STATIC_DRAW
      );
      this.gl.enableVertexAttribArray(texCoordLocation);
      this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

      // Create a buffer for the position of the rectangle corners.
      const buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

      // Set a rectangle the same size as the image.
      this.setRectangle(0, 0, this.width, this.height);

      // Setup the default layers
      this.tBase = this.setupTexture(this.sceneCanvas, 0, this.program, 'u_bas');
      this.tTex = this.setupTexture(this.contentCanvas, 1, this.program, 'u_tex');
      this.tPosition = this.setupTexture(
        this.positionCanvas,
        2,
        this.program,
        'u_pos',
        this.gl.NEAREST
      );
      this.tReflection = this.setupTexture(this.metaCanvas, 3, this.program, 'u_ref');

      const b: HTMLBodyElement = <HTMLBodyElement>document.body;

      if (!this.sceneCanvas.parentElement) {
        b.appendChild(this.glCanvas);
        b.appendChild(this.resultCanvas);
      }
      const oversamplingDiv: number = 1 / this.oversampling;
      this.glCanvas.style.cssText = this.resultCanvas.style.cssText = `position: absolute; top:0px; left:0px; display:none; transform:scale(${oversamplingDiv}, ${oversamplingDiv}); transform-origin: top left;`;
    }

    // lookup uniforms
    this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.numTilesLocation = this.gl.getUniformLocation(this.program, 'u_num_tiles');
    this.debugPositionMapperLocation = this.gl.getUniformLocation(this.program, 'u_debug');
    this.fakeWhiteLocation = this.gl.getUniformLocation(this.program, 'u_fake_white');

    this.shineCutOutLocation = this.gl.getUniformLocation(this.program, 'u_shine_cutout');
    this.shineColorLocation = this.gl.getUniformLocation(this.program, 'u_shine_color');

    // set the resolution
    this.gl.uniform2f(this.resolutionLocation, this.width, this.height);

    // set the number of tiles

    this.gl.uniform1f(this.numTilesLocation, this.threeDScene.numberOfTiles);

    // set debug mode on or off
    this.gl.uniform1f(
      this.debugPositionMapperLocation,
      PositionMapperWebGl.DEBUG_POSITION_MAPPER ? 1 : 0
    );

    // set fake white on or off
    this.gl.uniform1f(this.fakeWhiteLocation, this.threeDScene.whiteIsTransparent ? 1 : 0);

    /*
     * TEST
     *  set shine cutout on or off
     */
    this.gl.uniform1f(this.shineCutOutLocation, this.threeDScene.shineCutout ? 1 : 0);
    this.gl.uniform1i(this.shineColorLocation, this.threeDScene.shineColor);
  }

  private getLayerByCanvas(c: HTMLCanvasElement): IWebGLRenderLayer {
    for (const layer of this.tLayers) {
      if (layer.canvas.id === c.id) {
        return layer;
      }
    }
    return undefined;
  }

  private updateLayers(): void {
    if (this.tLayers) {
      this.tLayers.forEach((l: IWebGLRenderLayer) => {
        this.updateTexture(l.textureUnit, l.canvas);
      });
    }
  }

  private drawAndCrop(): void {
    // Draw the rectangle.
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    if (this.hasCrop) {
      console.log('Applying crop!', this.renderRectangle);
      this.resultContext.drawImage(
        this.glCanvas,
        this.renderRectangle.x,
        this.renderRectangle.y,
        this.renderRectangle.width,
        this.renderRectangle.height,
        0,
        0,
        this.renderRectangle.width,
        this.renderRectangle.height
      );
    }
    this.resultCanvas.style.display = 'none';
    this.glCanvas.style.display = 'none';
  }

  private setupTexture(
    canvas: HTMLCanvasElement,
    textureUnit: number,
    program: WebGLProgram,
    uniformName: string,
    smoothing: number = this.gl.LINEAR
  ) {
    console.log(`setupTexture: ${canvas.id}, ${textureUnit}, ${uniformName}`);
    const tex = this.gl.createTexture();
    this.updateTextureFromCanvas(tex, canvas, textureUnit);

    // Set the parameters so we can render any size image.
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, smoothing);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, smoothing);

    const location = this.gl.getUniformLocation(program, uniformName);
    this.gl.uniform1i(location, textureUnit);
    return tex;
  }

  private updateTexture(textureUnit: number, canvas: HTMLCanvasElement): void {
    const gl = this.gl;
    gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  private updateTextureFromCanvas(
    tex: WebGLTexture,
    canvas: HTMLCanvasElement,
    textureUnit: number
  ) {
    this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      canvas
    );
  }

  private setRectangle(x: number, y: number, width: number, height: number) {
    const x1: number = x;
    const x2: number = x + width;
    const y1: number = y;
    const y2: number = y + height;
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
      this.gl.STATIC_DRAW
    );
  }
}
