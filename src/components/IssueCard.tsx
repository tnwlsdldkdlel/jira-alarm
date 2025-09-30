import React from 'react';
import { JiraIssue } from '../types/jira';
import CommentDisplay from './CommentDisplay';
import './IssueCard.css';

interface IssueCardProps {
  issue: JiraIssue;
  onClick?: (issue: JiraIssue) => void;
  currentUserEmail?: string;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick, currentUserEmail }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 없음';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
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

  const getStatusBadges = () => {
    const badges = [];
    
    if (issue.isMentioned) {
      badges.push(
        <span key="mentioned" className="status-badge mentioned">
          💬 멘션됨
        </span>
      );
    }
    
    if (issue.isNew) {
      badges.push(
        <span key="new" className="status-badge new">
          ✨ 새 이슈
        </span>
      );
    }
    
    return badges;
  };


  const getStatusColor = (status: any) => {
    // Jira statusCategory의 colorName을 사용
    if (status?.statusCategory?.colorName) {
      switch (status.statusCategory.colorName.toLowerCase()) {
        case 'blue-gray':
          return '#5e6c84';
        case 'yellow':
          return '#f79232';
        case 'green':
          return '#00875a';
        case 'red':
          return '#de350b';
        case 'purple':
          return '#6554c0';
        case 'orange':
          return '#ff8b00';
        case 'light-blue':
          return '#00b8d9';
        case 'light-green':
          return '#36b37e';
        case 'light-red':
          return '#ff5630';
        case 'light-purple':
          return '#8777d9';
        case 'light-orange':
          return '#ffab00';
        case 'light-gray':
          return '#97a0af';
        case 'dark-blue':
          return '#0052cc';
        case 'dark-green':
          return '#006644';
        case 'dark-red':
          return '#bf2600';
        case 'dark-purple':
          return '#403294';
        case 'dark-orange':
          return '#b25400';
        case 'dark-gray':
          return '#42526e';
        default:
          return '#5e6c84';
      }
    }
    
    // statusCategory가 없는 경우 status 이름으로 fallback
    const statusName = status?.name || status || '';
    switch (statusName.toLowerCase()) {
      case 'open':
      case 'to do':
      case 'new':
        return '#14892c';
      case 'in progress':
      case 'processing':
      case '개발중':
      case '진행중':
        return '#0052cc';
      case 'review':
      case 'qa/test-dev반영':
      case 'testing':
      case 'qa':
        return '#ffab00';
      case 'done':
      case 'completed':
      case 'closed':
      case 'resolved':
      case '완료':
      case 'prod':
      case 'complete':
        return '#00875a';
      case 'cancelled':
        return '#de350b';
      default:
        return '#5e6c84';
    }
  };

  return (
    <div 
      className="issue-card" 
      onClick={() => onClick?.(issue)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="issue-header">
        <div className="issue-key">
          {issue.fields?.issuetype?.iconUrl && (
            <img 
              src={issue.fields.issuetype.iconUrl} 
              alt={issue.fields.issuetype.name || 'Issue Type'}
              className="issue-type-icon"
            />
          )}
          <span className="issue-key-text">{issue.key}</span>
        </div>
        <div className="issue-status-header">
          <span 
            className="status-badge-header"
            style={{ backgroundColor: getStatusColor(issue.fields?.status) }}
          >
            {issue.fields?.status?.name || 'Open'}
          </span>
        </div>
      </div>
      
      {/* 상태 배지들 */}
      {getStatusBadges().length > 0 && (
        <div className="status-badges">
          {getStatusBadges()}
        </div>
      )}
      
      <div className="issue-summary">
        {issue.fields?.summary}
      </div>
      
      <div className="issue-meta">
        <div className="issue-assignee">
          {issue.fields?.assignee ? (
            <span className="assignee-info">
              담당자: {issue.fields.assignee?.displayName || 'Unknown'}
            </span>
          ) : (
            <span className="no-assignee-info">담당자 없음</span>
          )}
        </div>
        <div className="issue-reporter">
          {issue.fields?.reporter ? (
            <span className="reporter-info">
              보고자: {issue.fields.reporter?.displayName || 'Unknown'}
            </span>
          ) : (
            <span className="no-reporter-info">보고자 없음</span>
          )}
        </div>
      </div>
      
      <div className="issue-dates">
        <span className="created-date">
          생성: {formatDate(issue.fields?.created || '')}
        </span>
        <span className="updated-date">
          수정: {formatDate(issue.fields?.updated || '')}
        </span>
      </div>
      
      {issue.fields?.description && (
        <div className="issue-description">
          {typeof issue.fields.description === 'string' 
            ? (issue.fields.description.length > 100 
                ? `${issue.fields.description.substring(0, 100)}...` 
                : issue.fields.description)
            : '설명이 있습니다'
          }
        </div>
      )}
      
      {/* 멘션된 댓글 표시 */}
      {issue.isMentioned && issue.mentionedComments && issue.mentionedComments.length > 0 && (
        <CommentDisplay 
          comments={issue.mentionedComments} 
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  );
};

export default IssueCard;
