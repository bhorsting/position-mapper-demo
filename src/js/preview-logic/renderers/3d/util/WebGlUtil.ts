export class WebGLUtil {
  /**
   * Wrapped logging function.
   * @param {string} msg The message to log.
   */
  public static error(msg: string): void {
    if (window.console) {
      if (window.console.error) {
        window.console.error(msg);
      } else if (window.console.log) {
        window.console.log(msg);
      }
    }
  }

  /**
   * Creates a program, attaches shaders, binds attrib locations, links the
   * program and calls useProgram.
   * @param gl
   * @param {WebGLShader[]} shaders The shaders to attach
   * @param {string[]?} opt_attribs The attribs names.
   * @param {number[]?} opt_locations The locations for the
   *        attribs.
   * @param opt_errorCallback
   */
  public static loadProgram(
    gl,
    shaders: WebGLShader[],
    opt_attribs?: string[],
    opt_locations?: number[],
    opt_errorCallback?: Function
  ) {
    let ii;
    const errFn = opt_errorCallback || WebGLUtil.error;
    const program = gl.createProgram();
    for (ii = 0; ii < shaders.length; ++ii) {
      gl.attachShader(program, shaders[ii]);
    }
    if (opt_attribs) {
      for (ii = 0; ii < opt_attribs.length; ++ii) {
        gl.bindAttribLocation(program, opt_locations ? opt_locations[ii] : ii, opt_attribs[ii]);
      }
    }
    gl.linkProgram(program);

    // Check the link status
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      // something went wrong with the link
      const lastError = gl.getProgramInfoLog(program);
      errFn('Error in program linking:' + lastError);

      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  /**
   * Loads a shader from a script tag.
   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {string} scriptId The id of the script tag.
   * @param {number} opt_shaderType The type of shader. If not passed in it will
   *     be derived from the type of the script tag.
   * @param opt_errorCallback
   * @return {WebGLShader} The created shader.
   */
  public static createShaderFromScript(
    gl: WebGLRenderingContext,
    scriptId: string,
    opt_shaderType?: number,
    opt_errorCallback?: Function
  ): WebGLShader {
    let shaderSource: string = '';
    let shaderType;
    const shaderScript: HTMLScriptElement = <HTMLScriptElement>document.getElementById(scriptId);
    if (!shaderScript) {
      throw '*** Error: unknown script element' + scriptId;
    }
    shaderSource = shaderScript.text;

    if (!opt_shaderType) {
      if (shaderScript.type === 'x-shader/x-vertex') {
        shaderType = gl.VERTEX_SHADER;
      } else if (shaderScript.type == 'x-shader/x-fragment') {
        shaderType = gl.FRAGMENT_SHADER;
      } else if (shaderType !== gl.VERTEX_SHADER && shaderType != gl.FRAGMENT_SHADER) {
        throw '*** Error: unknown shader type';
      }
    }

    return WebGLUtil.loadShader(
      gl,
      shaderSource,
      opt_shaderType ? opt_shaderType : shaderType,
      opt_errorCallback
    );
  }

  /**
   * Loads a shader.
   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {string} shaderSource The shader source.
   * @param {number} shaderType The type of shader.
   * @param opt_errorCallback
   * @return {WebGLShader} The created shader.
   */
  public static loadShader(
    gl: WebGLRenderingContext,
    shaderSource: string,
    shaderType: number,
    opt_errorCallback?: Function
  ): WebGLShader {
    const errFn = opt_errorCallback || WebGLUtil.error;
    // Create the shader object
    const shader = gl.createShader(shaderType);

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      // Something went wrong during compilation; get the error
      const lastError = gl.getShaderInfoLog(shader);
      errFn("*** Error compiling shader '" + shader + "':" + lastError);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Creates a webgl context. If creation fails it will
   * change the contents of the container of the <canvas>
   * tag to an error message with the correct links for WebGL.
   * @param {HTMLCanvasElement} canvas. The canvas element to
   *     create a context from.
   * @param {WebGLContextCreationAttributes} opt_attribs Any
   *     creation attributes you want to pass in.
   * @return {WebGLRenderingContext} The created context.
   */
  public static setupWebGL(canvas, opt_attribs) {
    if (!window['WebGLRenderingContext']) {
      alert('U heeft geen WebGL, probeer alstublieft een andere browser.');
      return null;
    }
    const context = WebGLUtil.create3DContext(canvas, opt_attribs);
    if (!context) {
      alert('Er is een WebGL probleem opgetreden, probeer alstublieft een andere browser.');
    }
    return context;
  }

  /**
   * Creates the HTML for a failure message
   *        canvas.
   * @return {string} The html.
   * @param msg
   */
  public static makeFailHTML(msg) {
    return `<table style="background-color: #8CE; width: 100%; height: 100%;"><tr><td align="center"><div style="display: table-cell; vertical-align: middle;"><div style="">${msg}</div></div></td></tr></table>`;
  }

  /**
   * Creates a webgl context.
   * @param {HTMLCanvasElement} canvas The canvas tag to get
   *     context from. If one is not passed in one will be
   *     created.
   * @param opt_attribs
   * @return {WebGLRenderingContext} The created context.
   */
  public static create3DContext(
    canvas: HTMLCanvasElement,
    opt_attribs: any
  ): WebGLRenderingContext {
    const names = ['webgl', 'experimental-webgl'];
    let context = null;
    for (let ii = 0; ii < names.length; ++ii) {
      try {
        context = canvas.getContext(names[ii], opt_attribs);
      } catch (e) {
        console.warn(e);
      }
      if (context) {
        break;
      }
    }
    return context;
  }

  /**
   * Gets a WebGL context.
   * makes its backing store the size it is displayed.
   */
  public static getWebGLContext(
    canvas: HTMLCanvasElement,
    opt_attribs?: any,
    opt_options?: any
  ): WebGLRenderingContext {
    const options = opt_options || {};

    if (WebGLUtil.isInIFrame()) {
      WebGLUtil.updateCSSIfInIFrame();

      // make the canvas backing store the size it's displayed.
      if (!options.dontResize) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }
    }

    return WebGLUtil.setupWebGL(canvas, opt_attribs);
  }

  /**
   * Check if the page is embedded.
   * @return {boolean} True of we are in an iframe
   */
  public static isInIFrame(): boolean {
    return window !== window.top;
  }

  public static updateCSSIfInIFrame(): void {
    if (WebGLUtil.isInIFrame()) {
      document.body.className = 'iframe';
    }
  }
}
