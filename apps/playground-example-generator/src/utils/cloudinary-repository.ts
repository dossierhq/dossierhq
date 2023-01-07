import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryAsset {
  public_id: string;
  width: number;
  height: number;
}

export async function listCloudinaryImages(folder: string): Promise<CloudinaryAsset[]> {
  const response = await cloudinary.api.resources({
    content_type: 'image',
    max_results: 500,
    prefix: folder + '/',
    type: 'upload',
  });
  return response.resources;
}
