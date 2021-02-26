/**
 * A tool for finding the bounding box around a set of colored pixels
 */
import { IRectangle } from '../renderers/3d/interfaces/Interfaces';

export class BoundingBoxScan {
  public static MAX_SCAN_BLOCK_SIZE: number = 256;
  public static MIN_SCAN_BLOCK_SIZE: number = 64;

  public static SCAN_OFFSET_RED: number = 0;
  public static SCAN_OFFSET_GREEN: number = 1;
  public static SCAN_OFFSET_BLUE: number = 2;
  public static SCAN_OFFSET_ALPHA: number = 3;

  /**
   * Scan the entire image for a rectangle in the red channel
   * @param {ImageData} data
   * @param {number} scanSize
   * @param {number} scanOffset 0 (default) for R, 1 for G, 2 for B
   * @returns {IRectangle}
   */
  public scan(
    data: ImageData,
    scanSize: number = BoundingBoxScan.MAX_SCAN_BLOCK_SIZE,
    scanOffset: number = 0
  ): IRectangle {
    console.log(`scan at ${scanSize} and offset ${scanOffset}`);
    const d: Uint8ClampedArray = data.data;
    const w: number = data.width;
    const h: number = data.height;
    let x: number;
    let y: number;
    let ptr: number;
    for (x = 0; x < w; x += scanSize) {
      for (y = 0; y < h; y += scanSize) {
        ptr = (x + y * w) * 4;
        // Check if channel is 'full' red. Do not check for 0xFF because JPEG compression messes up pure colors
        if (d[ptr + scanOffset] > 250) {
          return this.scanFromPoint(data, x, y, scanOffset);
        }
      }
    }
    if (scanSize > BoundingBoxScan.MIN_SCAN_BLOCK_SIZE) {
      // Recurse into scanning at quarter block size
      return this.scan(data, scanSize / 4, scanOffset);
    } else {
      // No success
      return undefined;
    }
  }

  /**
   * A red pixel has been found at (x,y)
   * Now find the top-left and bottom-right corner by scanning from that pixel
   *
   * @param {Uint8ClampedArray} pixels
   * @param {number} x
   * @param {number} y
   * @returns {IRectangle}
   */
  private scanFromPoint(data: ImageData, x: number, y: number, offset: number): IRectangle {
    const rect: IRectangle = {
      x: 0,
      y: 0,
      width: data.width,
      height: data.height,
    };
    const d: Uint8ClampedArray = data.data;
    const w: number = data.width;
    const h: number = data.height;
    let cnt: number = 0;
    // Find left
    for (cnt = x; cnt >= 0; cnt--) {
      if (d[offset + (cnt + y * w) * 4] < 50) {
        rect.x = cnt + 1;
        break;
      }
    }
    // Find right
    rect.width = data.width - rect.x;
    for (cnt = x; cnt <= w; cnt++) {
      if (d[offset + (cnt + y * w) * 4] < 50) {
        rect.width = cnt - 1 - rect.x;
        break;
      }
    }
    // Find top
    for (cnt = y; cnt >= 0; cnt--) {
      if (d[offset + (x + cnt * w) * 4] < 50) {
        rect.y = cnt + 1;
        break;
      }
    }
    // Find bottom
    rect.height = data.height - rect.y;
    for (cnt = y; cnt <= h; cnt++) {
      if (d[offset + (x + cnt * w) * 4] < 50) {
        rect.height = cnt - 1 - rect.y;
        break;
      }
    }
    return rect;
  }
}
