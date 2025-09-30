import React, { useState, useEffect } from 'react';
import { JiraService } from '../services/jiraService';
import { JiraIssue, JiraSearchResult, IssueFilter, StatusGroup } from '../types/jira';
import { filterMentionedComments } from '../utils/commentUtils';
import IssueCard from './IssueCard';
import './IssueList.css';

interface IssueListProps {
  jiraService: JiraService | null;
  filter: IssueFilter;
  onStatusGroupsUpdate: (groups: StatusGroup[]) => void;
  currentUserEmail?: string;
}

const IssueList: React.FC<IssueListProps> = ({ jiraService, filter, onStatusGroupsUpdate, currentUserEmail }) => {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const groupIssuesByStatus = (issues: JiraIssue[]): StatusGroup[] => {
    const statusMap = new Map<string, number>();
    
    issues.forEach(issue => {
      const status = issue.fields?.status?.name || 'Unknown';
      const lowerStatus = status.toLowerCase();
      
      // 완료 관련 상태들을 통합
      let normalizedStatus = status;
      if (status === 'Complete' || status === '완료' || status === 'PROD' || 
          lowerStatus.includes('complete') || lowerStatus.includes('완료') || lowerStatus.includes('prod')) {
        normalizedStatus = '완료';
      }
      // 해야할일 관련 상태들을 통합 (대소문자 구분 없이, 부분 문자열 매칭)
      else if (lowerStatus.includes('todo') || lowerStatus.includes('to do') || 
               lowerStatus.includes('해야할') || lowerStatus.includes('할일') ||
               lowerStatus.includes('이번달') || lowerStatus.includes('open') || 
               lowerStatus.includes('new') || status === 'Open' || status === 'New' ||
               // 공백이 있는 상태명도 포함
               lowerStatus.includes('해야 할') || lowerStatus.includes('할 일') ||
               lowerStatus.includes('이번 달') || lowerStatus.includes('이번달 업무')) {
        normalizedStatus = '해야할일';
      }
      
      statusMap.set(normalizedStatus, (statusMap.get(normalizedStatus) || 0) + 1);
    });

    return Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        displayName: status
      }))
      .sort((a, b) => b.count - a.count); // 개수 순으로 정렬
  };

  const loadIssues = async () => {
    if (!jiraService) return;

    setLoading(true);
    setError(null);

    try {
      let result: JiraSearchResult;
      let issuesToProcess: JiraIssue[] = [];

      // 필터에 따라 다른 API 호출
      if (filter === 'mentioned') {
        result = await jiraService.getMentionedIssues();
        issuesToProcess = result.issues.map(issue => {
          const processedIssue = { ...issue, isMentioned: true };
          
          // 멘션된 댓글 필터링
          if (issue.comments && issue.comments.comments && currentUserEmail) {
            const mentionedComments = filterMentionedComments(issue.comments.comments, currentUserEmail);
            processedIssue.mentionedComments = mentionedComments;
          }
          
          return processedIssue;
        });
      } else {
        // 전체 이슈를 가져와서 클라이언트에서 필터링
        result = await jiraService.getAllIssues();
        issuesToProcess = result.issues;
      }
      
      // status 그룹 업데이트 (전체 이슈 기준)
      if (filter === 'all' || filter === 'mentioned') {
        const allIssuesResult = await jiraService.getAllIssues();
        const statusGroups = groupIssuesByStatus(allIssuesResult.issues);
        onStatusGroupsUpdate(statusGroups);
      } else {
        const statusGroups = groupIssuesByStatus(issuesToProcess);
        onStatusGroupsUpdate(statusGroups);
      }
      
      // 필터링 적용
      if (filter === 'all') {
        setIssues(issuesToProcess);
      } else if (filter === 'mentioned') {
        setIssues(issuesToProcess);
      } else {
        // 클라이언트 사이드에서 특정 status로 필터링
        const filteredIssues = issuesToProcess.filter(issue => {
          const status = issue.fields?.status?.name || 'Unknown';
          const lowerStatus = status.toLowerCase();
          
          // 완료 상태는 Complete, 완료, PROD 모두 포함
          if (filter === '완료') {
            return status === 'Complete' || status === '완료' || status === 'PROD' || 
                   lowerStatus.includes('complete') || lowerStatus.includes('완료') || lowerStatus.includes('prod');
          }
          // 해야할일 상태는 대소문자 구분 없이, 부분 문자열 매칭
          else if (filter === '해야할일') {
            return lowerStatus.includes('todo') || lowerStatus.includes('to do') || 
                   lowerStatus.includes('해야할') || lowerStatus.includes('할일') ||
                   lowerStatus.includes('이번달') || lowerStatus.includes('open') || 
                   lowerStatus.includes('new') || status === 'Open' || status === 'New' ||
                   // 공백이 있는 상태명도 포함
                   lowerStatus.includes('해야 할') || lowerStatus.includes('할 일') ||
                   lowerStatus.includes('이번 달') || lowerStatus.includes('이번달 업무');
          }
          
          return status === filter;
        });
        setIssues(filteredIssues);
      }

      console.log('API Response:', result);
      console.log('Issues count:', result.issues?.length || 0);
      console.log('Total from API:', result.total);
      
      // 총 개수는 필터링된 이슈 수로 설정
      if (filter === 'all' || filter === 'mentioned') {
        setTotal(issuesToProcess.length);
      } else {
        let filteredCount = 0;
        if (filter === '완료') {
          filteredCount = issuesToProcess.filter(issue => {
            const status = issue.fields?.status?.name || 'Unknown';
            const lowerStatus = status.toLowerCase();
            return status === 'Complete' || status === '완료' || status === 'PROD' || 
                   lowerStatus.includes('complete') || lowerStatus.includes('완료') || lowerStatus.includes('prod');
          }).length;
        } else if (filter === '해야할일') {
          filteredCount = issuesToProcess.filter(issue => {
            const status = issue.fields?.status?.name || 'Unknown';
            const lowerStatus = status.toLowerCase();
            return lowerStatus.includes('todo') || lowerStatus.includes('to do') || 
                   lowerStatus.includes('해야할') || lowerStatus.includes('할일') ||
                   lowerStatus.includes('이번달') || lowerStatus.includes('open') || 
                   lowerStatus.includes('new') || status === 'Open' || status === 'New' ||
                   // 공백이 있는 상태명도 포함
                   lowerStatus.includes('해야 할') || lowerStatus.includes('할 일') ||
                   lowerStatus.includes('이번 달') || lowerStatus.includes('이번달 업무');
          }).length;
        } else {
          filteredCount = issuesToProcess.filter(issue => issue.fields?.status?.name === filter).length;
        }
        setTotal(filteredCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '이슈를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [jiraService, filter]);

  // 페이징된 이슈 계산
  const getPaginatedIssues = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return issues.slice(startIndex, endIndex);
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(total / itemsPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIssueClick = (issue: JiraIssue) => {
    // Jira 이슈 페이지로 이동
    const jiraUrl = jiraService ? 
      `${jiraService['baseUrl']}/browse/${issue.key}` : 
      `https://yourcompany.atlassian.net/browse/${issue.key}`;
    
    window.open(jiraUrl, '_blank');
  };

  const getFilterTitle = () => {
    switch (filter) {
      case 'request':
        return '요청';
      case 'inProgress':
        return '진행중';
      case 'review':
        return '검토';
      case 'completed':
        return '완료';
      case 'all':
        return '전체';
      default:
        return '이슈 목록';
    }
  };

  if (!jiraService) {
    return (
      <div className="issue-list-container">
        <div className="no-connection">
          <h3>Jira 연결이 필요합니다</h3>
          <p>설정에서 Jira 계정 정보를 입력해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-list-container">
      <div className="issue-list-header">
        <h2>{getFilterTitle()}</h2>
        <div className="issue-list-actions">
          <span className="issue-count">총 {total}개</span>
          <button 
            className="refresh-button" 
            onClick={loadIssues}
            disabled={loading}
          >
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>이슈를 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>❌ {error}</p>
          <button onClick={loadIssues} className="retry-button">
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <div className="no-issues">
          <p>📝 {getFilterTitle()}가 없습니다.</p>
        </div>
      )}

      {!loading && !error && issues.length > 0 && (
        <>
          <div className="issue-list">
            {getPaginatedIssues().map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onClick={handleIssueClick}
                currentUserEmail={currentUserEmail}
              />
            ))}
          </div>
          
          {/* 페이징 컨트롤 */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                <span>
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, total)} / {total}개
                </span>
              </div>
              
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  title="첫 페이지"
                >
                  ⏮️
                </button>
                
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="이전 페이지"
                >
                  ◀️
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-button page-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="다음 페이지"
                >
                  ▶️
                </button>
                
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  title="마지막 페이지"
                >
                  ⏭️
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IssueList;
