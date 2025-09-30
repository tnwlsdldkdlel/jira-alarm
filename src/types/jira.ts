export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface NotificationSettings {
  checkMentions: boolean;
  checkAssigned: boolean;
  checkReported: boolean;
  refreshInterval: number; // 분 단위
}

export type IssueFilter = 'all' | 'mentioned' | string; // 'all', 'mentioned' 또는 실제 status 값

export interface StatusGroup {
  status: string;
  count: number;
  displayName: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: any; // Jira의 댓글 본문은 복잡한 객체 구조를 가질 수 있음
  created: string;
  updated: string;
  visibility?: {
    type: string;
    value: string;
  };
}

export interface JiraComments {
  comments: JiraComment[];
  maxResults: number;
  total: number;
  startAt: number;
}

export interface JiraIssueType {
  id: string;
  name: string;
  iconUrl: string;
  description?: string;
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraStatus {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  statusCategory?: {
    id: number;
    key: string;
    colorName: string;
    name: string;
  };
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any; // Jira의 description은 복잡한 객체 구조를 가질 수 있음
    status: JiraStatus;
    priority: JiraPriority;
    assignee?: JiraUser;
    reporter?: JiraUser;
    created: string;
    updated: string;
    issuetype: JiraIssueType;
  };
  // 댓글 정보
  comments?: JiraComments;
  // UI에서 사용하는 추가 속성들
  isMentioned?: boolean;
  isNew?: boolean;
  mentionedComments?: JiraComment[]; // 멘션된 댓글들
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  total: number;
}
