// Jira 이슈 폴링 및 알림 서비스
import { JiraService } from './jiraService';
import { JiraIssue } from '../types/jira';

export interface PollingConfig {
  interval: number; // 폴링 간격 (밀리초)
  enabled: boolean;
  checkNewIssues: boolean;
  checkMentions: boolean;
  checkStatusChanges: boolean;
}

export interface IssueChange {
  type: 'new' | 'assigned' | 'mentioned' | 'status_changed';
  issue: JiraIssue;
  previousStatus?: string;
  timestamp: Date;
}

export class JiraPollingService {
  private static instance: JiraPollingService;
  private jiraService: JiraService | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private config: PollingConfig = {
    interval: 30000, // 30초
    enabled: false,
    checkNewIssues: true,
    checkMentions: true,
    checkStatusChanges: true
  };
  private lastCheckedIssues: Map<string, JiraIssue> = new Map();
  private changeCallbacks: ((changes: IssueChange[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): JiraPollingService {
    if (!JiraPollingService.instance) {
      JiraPollingService.instance = new JiraPollingService();
    }
    return JiraPollingService.instance;
  }

  // Jira 서비스 설정
  public setJiraService(service: JiraService | null): void {
    this.jiraService = service;
  }

  // 폴링 설정 업데이트
  public updateConfig(config: Partial<PollingConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 폴링이 활성화되어 있고 기존 폴링이 실행 중이면 재시작
    if (this.config.enabled && this.pollingInterval) {
      this.stopPolling();
      this.startPolling();
    }
  }

  // 폴링 시작
  public startPolling(): void {
    if (!this.jiraService || !this.config.enabled) {
      console.log('Jira service not available or polling disabled');
      return;
    }

    if (this.pollingInterval) {
      console.log('Polling already running');
      return;
    }

    console.log('Starting Jira polling with interval:', this.config.interval);
    
    // 즉시 한 번 실행
    this.checkForChanges();
    
    // 주기적으로 실행
    this.pollingInterval = setInterval(() => {
      this.checkForChanges();
    }, this.config.interval);
  }

  // 폴링 중지
  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Jira polling stopped');
    }
  }

  // 변경사항 감지
  private async checkForChanges(): Promise<void> {
    if (!this.jiraService) return;

    try {
      console.log('Checking for Jira changes...');
      
      // 현재 이슈들 가져오기
      const currentIssues = await this.jiraService.getAllIssues();
      const changes: IssueChange[] = [];

      // 새로 할당된 이슈 확인
      if (this.config.checkNewIssues) {
        const newIssues = this.findNewIssues(currentIssues.issues);
        changes.push(...newIssues);
      }

      // 상태 변경 확인
      if (this.config.checkStatusChanges) {
        const statusChanges = this.findStatusChanges(currentIssues.issues);
        changes.push(...statusChanges);
      }

      // 변경사항이 있으면 콜백 호출
      if (changes.length > 0) {
        console.log(`Found ${changes.length} changes:`, changes);
        this.changeCallbacks.forEach(callback => callback(changes));
      }

      // 현재 이슈들을 마지막 체크된 이슈로 저장
      this.updateLastCheckedIssues(currentIssues.issues);

    } catch (error) {
      console.error('Error checking for changes:', error);
    }
  }

  // 새로 할당된 이슈 찾기
  private findNewIssues(currentIssues: JiraIssue[]): IssueChange[] {
    const changes: IssueChange[] = [];
    
    currentIssues.forEach(issue => {
      const lastChecked = this.lastCheckedIssues.get(issue.key);
      
      if (!lastChecked) {
        // 완전히 새로운 이슈
        changes.push({
          type: 'new',
          issue,
          timestamp: new Date()
        });
      } else if (lastChecked.fields.assignee?.accountId !== issue.fields.assignee?.accountId) {
        // 담당자 변경
        changes.push({
          type: 'assigned',
          issue,
          timestamp: new Date()
        });
      }
    });

    return changes;
  }

  // 상태 변경 찾기
  private findStatusChanges(currentIssues: JiraIssue[]): IssueChange[] {
    const changes: IssueChange[] = [];
    
    currentIssues.forEach(issue => {
      const lastChecked = this.lastCheckedIssues.get(issue.key);
      
      if (lastChecked && lastChecked.fields.status.name !== issue.fields.status.name) {
        changes.push({
          type: 'status_changed',
          issue,
          previousStatus: lastChecked.fields.status.name,
          timestamp: new Date()
        });
      }
    });

    return changes;
  }

  // 마지막 체크된 이슈 업데이트
  private updateLastCheckedIssues(issues: JiraIssue[]): void {
    this.lastCheckedIssues.clear();
    issues.forEach(issue => {
      this.lastCheckedIssues.set(issue.key, issue);
    });
  }

  // 변경사항 콜백 등록
  public onChanges(callback: (changes: IssueChange[]) => void): void {
    this.changeCallbacks.push(callback);
  }

  // 변경사항 콜백 제거
  public offChanges(callback: (changes: IssueChange[]) => void): void {
    const index = this.changeCallbacks.indexOf(callback);
    if (index > -1) {
      this.changeCallbacks.splice(index, 1);
    }
  }

  // 현재 설정 가져오기
  public getConfig(): PollingConfig {
    return { ...this.config };
  }

  // 폴링 상태 확인
  public isPolling(): boolean {
    return this.pollingInterval !== null;
  }

  // 수동으로 변경사항 확인
  public async checkNow(): Promise<IssueChange[]> {
    if (!this.jiraService) return [];

    try {
      const currentIssues = await this.jiraService.getAllIssues();
      const changes: IssueChange[] = [];

      if (this.config.checkNewIssues) {
        changes.push(...this.findNewIssues(currentIssues.issues));
      }

      if (this.config.checkStatusChanges) {
        changes.push(...this.findStatusChanges(currentIssues.issues));
      }

      this.updateLastCheckedIssues(currentIssues.issues);
      return changes;
    } catch (error) {
      console.error('Error in manual check:', error);
      return [];
    }
  }
}
