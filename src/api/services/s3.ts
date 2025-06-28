import apiClient  from '../axios';

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileType: string;
  fileSize?: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileName: string;
  expiresIn: number;
}

export const s3Service = {
  /**
   * S3 Presigned URL 생성
   */
  generatePresignedUrl: async (request: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
    const response = await apiClient.post<PresignedUrlResponse>('/s3/presigned-url', request);
    return response.data;
  },

  /**
   * 업로드 완료 확인 (선택사항)
   */
  confirmUpload: async (fileName: string): Promise<void> => {
    await apiClient.post('/s3/upload-complete', null, {
      params: { fileName }
    });
  },
}; 