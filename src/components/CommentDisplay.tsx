import React, { useState } from 'react';
import { JiraComment } from '../types/jira';
import { extractCommentText, formatCommentDate, getCommentPreview, highlightMentions, findMentionedParts } from '../utils/commentUtils';
import './CommentDisplay.css';

interface CommentDisplayProps {
  comments: JiraComment[];
  currentUserEmail?: string;
}

const CommentDisplay: React.FC<CommentDisplayProps> = ({ comments, currentUserEmail }) => {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleComment = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="comment-display">
        <div className="no-comments">
          <span className="no-comments-icon">💬</span>
          <span>멘션된 댓글이 없습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-display">
      <div className="comment-header">
        <span className="comment-count">
          💬 멘션된 댓글 {comments.length}개
        </span>
      </div>
      
      <div className="comments-list">
        {comments.map((comment) => {
          const isExpanded = expandedComments.has(comment.id);
          const commentText = extractCommentText(comment.body);
          const previewText = getCommentPreview(comment, 150);
          const mentionedParts = findMentionedParts(commentText, currentUserEmail || '');
          const highlightedText = highlightMentions(isExpanded ? commentText : previewText, currentUserEmail || '');
          
          return (
            <div key={comment.id} className="comment-item">
              <div className="comment-author">
                <div className="author-info">
                  {comment.author.avatarUrls?.['16x16'] && (
                    <img 
                      src={comment.author.avatarUrls['16x16']} 
                      alt={comment.author.displayName}
                      className="author-avatar"
                    />
                  )}
                  <span className="author-name">{comment.author.displayName}</span>
                  <span className="comment-date">
                    {formatCommentDate(comment.created)}
                  </span>
                </div>
                {mentionedParts.length > 0 && (
                  <div className="mention-indicator">
                    <span className="mention-badge">
                      💬 {mentionedParts.join(', ')} 멘션됨
                    </span>
                  </div>
                )}
              </div>
              
              <div className="comment-content">
                <div 
                  className="comment-text"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
                
                {commentText.length > 150 && (
                  <button 
                    className="expand-button"
                    onClick={() => toggleComment(comment.id)}
                  >
                    {isExpanded ? '접기' : '더 보기'}
                  </button>
                )}
              </div>
              
              {comment.visibility && (
                <div className="comment-visibility">
                  <span className="visibility-badge">
                    {comment.visibility.type === 'role' ? '🔒' : '👁️'} 
                    {comment.visibility.value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentDisplay;
