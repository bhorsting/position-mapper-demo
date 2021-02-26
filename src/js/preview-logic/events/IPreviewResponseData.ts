import { PREVIEW_TYPES } from './IPreviewRequestData';

export interface IPreviewResponseData {
  productPartName?: string;
  image?: string;
  id?: string;
  type: PREVIEW_TYPES;
  navigationItemsAmount?: number;
  currentNavigatedIndex?: number;
  silent?: boolean;
  customerCreatedContentId?: number;
  sideName?: string;
}
