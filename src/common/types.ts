export enum MediaType {
  VIDEO = 'Video',
  IMAGE = 'Image',
}

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}
