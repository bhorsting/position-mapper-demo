import { PositionMapperWebGl } from './PositionMapperWebGl';

export class PreviewSetLoader {
  constructor(private readonly baseUrl: string) {}
  async loadSet(id: number, textureUrl, positionMapper: PositionMapperWebGl) {
    const baseImageUrl = `${this.baseUrl}/${id}/images/scene`;
    let positionUrl = `${this.baseUrl}/${id}/images/uv`;
    let reflectionMapUrl = `${this.baseUrl}/${id}/images/meta`;
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
