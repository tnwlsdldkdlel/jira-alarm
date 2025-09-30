import axios from 'axios';
import { JiraIssue, JiraSearchResult } from '../types/jira';

export class JiraService {
  private baseUrl: string;
  private email: string;
  private apiToken: string;

  constructor(baseUrl: string, email: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // 마지막 슬래시 제거
    this.email = email;
    this.apiToken = apiToken;
  }

  // 요청 상태 이슈 검색
  async getRequestIssues(): Promise<JiraSearchResult> {
    try {
      const jql = '(assignee = currentUser() OR reporter = currentUser()) AND status IN ("REQUEST", "요청", "To Do", "Open") ORDER BY updated DESC';
      
      console.log('요청 이슈 JQL:', jql);
      
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('요청 이슈 API 응답:', response.data);
      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('요청 이슈 검색 중 오류:', error);
      throw new Error('요청 이슈를 가져오는데 실패했습니다.');
    }
  }

  // 완료된 이슈 검색 (담당자이거나 보고자인 이슈 중 완료 상태)
  async getCompletedIssues(): Promise<JiraSearchResult> {
    try {
      const jql = '(assignee = currentUser() OR reporter = currentUser()) AND status IN ("완료", "Done", "Closed", "Resolved") ORDER BY updated DESC';
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('완료된 이슈 검색 중 오류:', error);
      throw new Error('완료된 이슈를 가져오는데 실패했습니다.');
    }
  }

  // 진행중인 이슈 검색 (담당자이거나 보고자인 이슈 중 진행중 상태)
  async getInProgressIssues(): Promise<JiraSearchResult> {
    try {
      const jql = '(assignee = currentUser() OR reporter = currentUser()) AND status IN ("PROCESSING", "개발중", "In Progress", "In Development", "진행중") ORDER BY updated DESC';
      
      console.log('진행중 이슈 JQL:', jql);
      
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('진행중 이슈 API 응답:', response.data);
      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('진행중인 이슈 검색 중 오류:', error);
      throw new Error('진행중인 이슈를 가져오는데 실패했습니다.');
    }
  }

  // 검토 상태 이슈 검색
  async getReviewIssues(): Promise<JiraSearchResult> {
    try {
      const jql = '(assignee = currentUser() OR reporter = currentUser()) AND status IN ("QA/Test-Dev반영", "검토", "Review", "Testing", "QA") ORDER BY updated DESC';
      
      console.log('검토 이슈 JQL:', jql);
      
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('검토 이슈 API 응답:', response.data);
      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('검토 이슈 검색 중 오류:', error);
      throw new Error('검토 이슈를 가져오는데 실패했습니다.');
    }
  }

  // 전체 이슈 검색 (담당자이거나 보고자인 모든 이슈)
  async getAllIssues(): Promise<JiraSearchResult> {
    try {
      const jql = '(assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC';
      
      console.log('전체 이슈 JQL:', jql);
      
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('전체 이슈 API 응답:', response.data);
      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('전체 이슈 검색 중 오류:', error);
      throw new Error('전체 이슈를 가져오는데 실패했습니다.');
    }
  }

  // 특정 상태의 이슈 검색
  async getIssuesByStatus(status: string): Promise<JiraSearchResult> {
    try {
      // status 이름에 공백이나 특수문자가 있을 수 있으므로 IN 절 사용
      const jql = `(assignee = currentUser() OR reporter = currentUser()) AND status IN ("${status}") ORDER BY updated DESC`;
      
      console.log('상태별 이슈 JQL:', jql);
      console.log('검색할 상태:', status);
      
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('상태별 이슈 API 응답:', response.data);
      console.log('상태별 이슈 개수:', response.data.data.issues?.length || 0);
      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('상태별 이슈 검색 중 오류:', error);
      throw new Error('상태별 이슈를 가져오는데 실패했습니다.');
    }
  }

  // 보고자 이슈 검색
  async getReportedIssues(): Promise<JiraSearchResult> {
    try {
      const jql = 'reporter = currentUser() ORDER BY updated DESC';
      
      console.log('보고자 이슈 JQL:', jql);
      
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('보고자 이슈 API 응답:', response.data);
      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('보고자 이슈 검색 중 오류:', error);
      throw new Error('보고자 이슈를 가져오는데 실패했습니다.');
    }
  }

  // 멘션된 이슈 검색 (댓글에서 멘션, 완료된 이슈 제외)
  async getMentionedIssues(): Promise<JiraSearchResult> {
    try {
      // Jira에서 멘션된 이슈를 찾는 JQL (완료된 이슈 제외)
      // 실제 Jira 인스턴스에 따라 다를 수 있음
      const jql = 'comment ~ currentUser() AND status NOT IN ("완료", "Done", "Closed", "Resolved", "Complete", "PROD") ORDER BY updated DESC';
      
      console.log('멘션된 이슈 JQL:', jql);
      
      const response = await axios.post('/api/jira/search', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken,
        jql,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description,comment',
        expand: 'changelog,comments',
        maxResults: 50
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('멘션된 이슈 API 응답:', response.data);
      return {
        issues: response.data.data.issues,
        total: response.data.data.total
      };
    } catch (error) {
      console.error('멘션된 이슈 검색 중 오류:', error);
      throw new Error('멘션된 이슈를 가져오는데 실패했습니다.');
    }
  }


  // 연결 테스트
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.post('/api/jira/test-connection', {
        baseUrl: this.baseUrl,
        email: this.email,
        apiToken: this.apiToken
      });

      return response.data.success;
    } catch (error) {
      console.error('Jira 연결 테스트 실패:', error);
      return false;
    }
  }
}
