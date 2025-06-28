import 'react-native-get-random-values'; // AWS SDK 사용을 위해 필요
import { v4 as uuidv4 } from 'uuid';
import { s3Service } from '../api/services/s3';
// import AWS from 'aws-sdk'; // 주석 처리 - 설치 후 활성화

export interface S3UploadConfig {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// 기본 S3 설정
export const DEFAULT_S3_CONFIG: S3UploadConfig = {
  bucket: 'makefood-receipts',
  region: 'ap-northeast-2', // 서울 리전
  // 보안상 이유로 credentials는 별도 관리 필요
};

/**
 * Presigned URL을 사용한 안전한 S3 업로드 (권장)
 */
export const uploadWithPresignedUrl = async (
  imageUri: string,
  fileType: string = 'recipe',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    // 파일 정보 추출
    const fileName = `${fileType}_${Date.now()}.jpg`;
    const fileInfo = await getFileInfo(imageUri);
    
    // 1. 백엔드에서 presigned URL 받기
    const { uploadUrl, fileUrl } = await s3Service.generatePresignedUrl({
      fileName,
      contentType: 'image/jpeg',
      fileType,
      fileSize: fileInfo.size,
    });

    // 2. S3에 직접 업로드 (진행률 추적 포함)
    const uploadResult = await uploadFileWithProgress(uploadUrl, imageUri, onProgress);
    
    if (uploadResult.status === 200) {
      return fileUrl;
    } else {
      throw new Error(`업로드 실패: ${uploadResult.status}`);
    }
  } catch (error) {
    console.error('Presigned URL 업로드 오류:', error);
    throw error;
  }
};

/**
 * AWS SDK를 사용한 직접 업로드 (IAM 권한 필요)
 */
export const uploadWithAwsSdk = async (
  imageUri: string,
  config: S3UploadConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    // AWS SDK 설치 후 주석 해제
    /*
    AWS.config.update({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    });

    const s3 = new AWS.S3();
    const fileName = `receipts/${uuidv4()}.jpg`;

    // 파일 읽기
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const uploadParams = {
      Bucket: config.bucket,
      Key: fileName,
      Body: blob,
      ContentType: 'image/jpeg',
      ACL: 'public-read', // 또는 'private'
    };

    const upload = s3.upload(uploadParams);
    
    // 진행률 추적
    upload.on('httpUploadProgress', (event) => {
      if (onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    const result = await upload.promise();
    return result.Location;
    */
    
    throw new Error('AWS SDK가 설치되지 않았습니다. uploadWithPresignedUrl을 사용하세요.');
  } catch (error) {
    console.error('AWS SDK 업로드 오류:', error);
    throw error;
  }
};

/**
 * 개발 모드용 목업 업로드
 */
export const uploadMock = async (
  imageUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // 진행률 시뮬레이션
  const simulateProgress = async () => {
    for (let i = 0; i <= 100; i += 10) {
      if (onProgress) {
        onProgress({
          loaded: i,
          total: 100,
          percentage: i,
        });
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  await simulateProgress();
  return `https://${DEFAULT_S3_CONFIG.bucket}.s3.${DEFAULT_S3_CONFIG.region}.amazonaws.com/receipts/${uuidv4()}.jpg`;
};

/**
 * 진행률을 추적하는 파일 업로드
 */
const uploadFileWithProgress = async (
  uploadUrl: string,
  fileUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ status: number }> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      resolve({ status: xhr.status });
    });

    xhr.addEventListener('error', () => {
      reject(new Error('네트워크 오류'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', 'image/jpeg');
    
    // 파일을 Blob으로 변환하여 업로드
    fetch(fileUri)
      .then(response => response.blob())
      .then(blob => xhr.send(blob))
      .catch(reject);
  });
};

/**
 * 파일 정보 추출 함수
 */
const getFileInfo = async (fileUri: string): Promise<{ size: number }> => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return { size: blob.size };
  } catch (error) {
    console.warn('파일 크기 추출 실패, 기본값 사용:', error);
    return { size: 1024 * 1024 }; // 1MB 기본값
  }
};

/**
 * 통합 업로드 함수 (환경에 따라 자동 선택)
 */
export const uploadToS3 = async (
  imageUri: string,
  fileType: string = 'recipe',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  if (__DEV__) {
    // 개발 모드: 실제 Presigned URL 사용 (테스트 목적)
    return uploadWithPresignedUrl(imageUri, fileType, onProgress);
  } else {
    // 프로덕션 모드: Presigned URL 사용 (권장)
    return uploadWithPresignedUrl(imageUri, fileType, onProgress);
  }
}; 