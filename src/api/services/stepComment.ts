import apiClient from '../axios';
import { CommentDto } from '../../types/recipe';

const BASE_PATH = '/steps';

export const stepCommentService = {
  /**
   * 특정 스텝의 댓글 목록 조회
   * GET /api/steps/{stepId}/comments
   */
  getStepComments: (stepId: number) => 
    apiClient.get<CommentDto[]>(`${BASE_PATH}/${stepId}/comments`),

  /**
   * 스텝에 댓글 추가
   * POST /api/steps/{stepId}/comments
   */
  addStepComment: (stepId: number, comment: CommentDto) => 
    apiClient.post<CommentDto>(`${BASE_PATH}/${stepId}/comments`, comment),

  /**
   * 댓글 수정
   * PUT /api/steps/comments/{commentId}
   */
  updateComment: (commentId: number, comment: CommentDto) => 
    apiClient.put<CommentDto>(`${BASE_PATH}/comments/${commentId}`, comment),

  /**
   * 댓글 삭제
   * DELETE /api/steps/comments/{commentId}
   */
  deleteComment: (commentId: number) => 
    apiClient.delete(`${BASE_PATH}/comments/${commentId}`),
}; 