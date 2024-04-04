import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';

const bucketRegion = process.env.BUCKET_REGION!;
const accessKey = process.env.BUCKET_ACCESS_KEY!;
const secretKey = process.env.BUCKET_SECRET_KEY!;
const bucketName = process.env.BUCKET_NAME!;

const s3Client = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: bucketRegion,
});

export async function resizeThumbnail(
  file: Express.Multer.File,
  sizeLimitKb: number,
  quality = 80,
): Promise<sharp.Sharp> {
  let compressedImage: sharp.Sharp;
  let compressedSize: number;
  let qualityValue = quality;

  compressedImage = sharp(file.buffer)
    .resize({
      width: 500,
      height: 500,
      fit: 'cover',
    })
    .webp({
      quality: qualityValue,
    });

  const size = await compressedImage.metadata().then((x) => x.size);

  if (!size) throw 'Failed to resize image';

  compressedSize = size;
  qualityValue -= 10;

  while (compressedSize > sizeLimitKb * 1024) {
    if (quality === 10) {
      throw 'Failed to resize image';
    }

    compressedImage = await sharp(await compressedImage.toBuffer()).webp({
      quality: qualityValue,
    });

    const size = await compressedImage.metadata().then((x) => x.size);

    if (!size) {
      throw 'Failed to resize image';
    }

    compressedSize = size;
    qualityValue -= 10;
  }

  return compressedImage;
}

export async function uploadToS3({
  folder,
  fileName,
  resizedImage,
  resizedBuffer,
  isPublic = false,
}: {
  folder: string;
  fileName: string;
  resizedImage: sharp.Sharp;
  resizedBuffer: Buffer;
  isPublic?: boolean;
}): Promise<string> {
  const bucketParams: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: `${folder}/${fileName}`,
    Body: resizedBuffer,
    ContentType: await resizedImage.metadata().then((x) => x.format),
    ACL: isPublic ? 'public-read' : 'private',
  };

  const command = new PutObjectCommand(bucketParams);

  const s3UploadResult = await s3Client.send(command);

  if (s3UploadResult.$metadata.httpStatusCode !== 200) {
    throw 'Failed to upload thumbnail';
  }

  const objectUrl = `https://${bucketName}.s3.amazonaws.com/${folder}/${fileName}`;

  return objectUrl;
}

export async function getSignedImageUrl(
  folder: string,
  fileName: string,
): Promise<string> {
  const bucketParams = {
    Bucket: bucketName,
    Key: `${folder}/${fileName}`,
  };

  const command = new GetObjectCommand(bucketParams);
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return url;
}
