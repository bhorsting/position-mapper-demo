import { PositionMapperWebGl } from './PositionMapperWebGl';

export class PreviewSetLoader {
  constructor(private readonly baseUrl: string) {}
  async loadSet(id: number, textureUrl, positionMapper: PositionMapperWebGl) {
    const baseImageUrl = `${this.baseUrl}/${id}/scene`;
    let positionUrl = `${this.baseUrl}/${id}/uv`;
    let reflectionMapUrl = `${this.baseUrl}/${id}/meta`;
    await positionMapper.load(
      baseImageUrl,
      textureUrl,
      positionUrl,
      reflectionMapUrl,
      undefined,
      [],
      []
    );
  }
}
