import { JiraComment } from '../types/jira';

// Jira 댓글 본문에서 텍스트 추출
export const extractCommentText = (body: any): string => {
  if (typeof body === 'string') {
    return body;
  }
  
  if (body && typeof body === 'object') {
    // Atlassian Document Format (ADF) 처리
    if (body.type === 'doc' && body.content) {
      return extractTextFromADF(body);
    }
    
    // 기타 객체 형태의 본문 처리
    if (body.content) {
      return extractTextFromADF(body);
    }
    
    // 단순 텍스트 필드가 있는 경우
    if (body.text) {
      return body.text;
    }
  }
  
  return '댓글 내용을 불러올 수 없습니다.';
};

// ADF (Atlassian Document Format)에서 텍스트 추출
const extractTextFromADF = (node: any): string => {
  if (!node) return '';
  
  if (typeof node === 'string') {
    return node;
  }
  
  if (Array.isArray(node)) {
    return node.map(extractTextFromADF).join('');
  }
  
  if (node.type === 'text' && node.text) {
    return node.text;
  }
  
  if (node.type === 'paragraph' && node.content) {
    return extractTextFromADF(node.content) + '\n';
  }
  
  if (node.type === 'hardBreak') {
    return '\n';
  }
  
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromADF).join('');
  }
  
  return '';
};

// 멘션된 댓글 필터링
export const filterMentionedComments = (comments: JiraComment[], currentUserEmail: string): JiraComment[] => {
  return comments.filter(comment => {
    const commentText = extractCommentText(comment.body);
    // 현재 사용자 이메일이나 @username 형태로 멘션된 댓글 찾기
    return commentText.toLowerCase().includes(currentUserEmail.toLowerCase()) ||
           commentText.includes('@' + currentUserEmail.split('@')[0]);
  });
};

// 댓글 작성 시간 포맷팅
export const formatCommentDate = (dateString: string): string => {
  if (!dateString) return '날짜 없음';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '날짜 오류';
    }

    // KST (UTC+9) 시간대로 변환
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    
    return kstDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '날짜 오류';
  }
};

// 댓글 미리보기 텍스트 생성 (길이 제한)
export const getCommentPreview = (comment: JiraComment, maxLength: number = 100): string => {
  const text = extractCommentText(comment.body);
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

// 멘션된 부분을 하이라이트하는 HTML 생성
export const highlightMentions = (text: string, currentUserEmail: string): string => {
  if (!currentUserEmail) return text;
  
  const emailPrefix = currentUserEmail.split('@')[0];
  const emailRegex = new RegExp(`@${emailPrefix}|${currentUserEmail}`, 'gi');
  
  return text.replace(emailRegex, (match) => {
    return `<mark class="mention-highlight">${match}</mark>`;
  });
};

// 멘션된 부분을 찾아서 반환
export const findMentionedParts = (text: string, currentUserEmail: string): string[] => {
  if (!currentUserEmail) return [];
  
  const emailPrefix = currentUserEmail.split('@')[0];
  const emailRegex = new RegExp(`@${emailPrefix}|${currentUserEmail}`, 'gi');
  const matches = text.match(emailRegex);
  
  if (!matches) return [];
  
  const uniqueMatches = new Set(matches);
  return Array.from(uniqueMatches);
};
