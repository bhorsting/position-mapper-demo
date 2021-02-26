/**
 * Dynamically creates a block of WebGL Fragment Shader code according to settings
 */
import { IThreeDLayer, IThreeDScene, ThreeDLayerType } from '../interfaces/Interfaces';

export class FragmentShaderCompiler {
  private static SAMPLER_TEMPLATE_STRING: string = '//@TEMPLATE_SAMPLERS@//';
  private static LAYER_LOGIC_TEMPLATE_STRING: string = '//@TEMPLATE_LAYER_LOGIC@//';
  private static BASE_BLEND_LOGIC_TEMPLATE_STRING: string = '//@BASE_BLEND_LOGIC@//';
  private static FRAGMENT_LOGIC_TEMPLATE_STRING: string = '//@TEMPLATE_FRAGCOLOR_LOGIC@//';

  public static createFragmentShader(scene: IThreeDScene, shaderBase: string): string {
    let layerLogic: string = '';
    let samplers: string = '';
    const layers: IThreeDLayer[] = scene.layers;
    layers.forEach((l: IThreeDLayer, index: number) => {
      samplers += `uniform sampler2D u_layer_${index};\n`;
      samplers += `uniform sampler2D u_layer_content_${index};\n`;

      layerLogic += `vec4 layercol_${index} = texture2D(u_layer_${index}, v_posCoord);\n`;
      layerLogic += `vec4 layer_content_col_${index} = texture2D(u_layer_content_${index}, v_texCoord);\n`;

      switch (l.type) {
        case ThreeDLayerType.ALPHA_CUTOUT:
          //Get the layer content color, blend by alpha from layer
          layerLogic += `maincol = (layer_content_col_${index}*layercol_${index}.a)+(maincol*(1.0-layercol_${index}.a));\n`;
          break;
        case ThreeDLayerType.MULTIPLY:
          layerLogic += `maincol = (maincol*layer_content_col_${index}*layercol_${index}.a*metaColor.b)+(maincol*a1);\n`;
      }
    });

    let blendLogic: string;
    let fragLogic: string;

    console.log('Compiling for scene', scene);

    if (scene.shineCutout) {
      console.log('Using shine cutout');
      blendLogic = ` vec4 maincol = col/41.0;`;
      fragLogic = ` gl_FragColor = accscene + min(((accmeta.ggga * shineColor)+(accmeta.ggga * 0.05))*(1.0-acccol), vec4(1.0));`;
    } else {
      if (scene.whiteIsTransparent) {
        console.log('Using fake white');
        // Calculate if color is white
        blendLogic = `
                    float luma = blur_luma_and_thin_edges(0.01, u_tex, v_posCoord);
                    vec4 maincol = (sceneColor * luma) + (col/41.0 * (1.0-luma));`;
        fragLogic = `gl_FragColor = acccol;`; //No shine on fake white scenes
      } else {
        blendLogic = ` vec4 maincol = (sceneColor*(col/41.0)*metaColor.b * (col/41.0).a)+(sceneColor*a1)`;
        fragLogic = `gl_FragColor = min(acccol+accmeta.ggga, vec4(1.0));`;
      }
    }

    return shaderBase
      .replace(FragmentShaderCompiler.SAMPLER_TEMPLATE_STRING, samplers)
      .replace(FragmentShaderCompiler.BASE_BLEND_LOGIC_TEMPLATE_STRING, blendLogic)
      .replace(FragmentShaderCompiler.LAYER_LOGIC_TEMPLATE_STRING, layerLogic)
      .replace(FragmentShaderCompiler.FRAGMENT_LOGIC_TEMPLATE_STRING, fragLogic);
  }
}
