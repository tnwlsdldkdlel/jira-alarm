import React, { useState, useEffect, useCallback } from 'react';
import { JiraService } from './services/jiraService';
import { JiraConfig, IssueFilter, StatusGroup } from './types/jira';
import JiraConfigComponent from './components/JiraConfig';
import IssueList from './components/IssueList';
import NotificationSettings from './components/NotificationSettings';
import { NotificationService } from './services/notificationService';
import { JiraPollingService, IssueChange } from './services/jiraPollingService';
import './App.css';

function App() {
  const [jiraService, setJiraService] = useState<JiraService | null>(null);
  const [jiraConfig, setJiraConfig] = useState<JiraConfig | null>(null);
  const [currentFilter, setCurrentFilter] = useState<IssueFilter>('all');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [notificationService] = useState(() => NotificationService.getInstance());
  const [pollingService] = useState(() => JiraPollingService.getInstance());

  // 알림 변경사항 처리
  const handleIssueChanges = useCallback((changes: IssueChange[]) => {
    changes.forEach(change => {
      let title = 'Jira 알림';
      let body = '';

      switch (change.type) {
        case 'new':
          title = '새 이슈 할당';
          body = `새로운 이슈가 할당되었습니다: ${change.issue.key} - ${change.issue.fields.summary}`;
          break;
        case 'assigned':
          title = '이슈 담당자 변경';
          body = `이슈 담당자가 변경되었습니다: ${change.issue.key} - ${change.issue.fields.summary}`;
          break;
        case 'status_changed':
          title = '이슈 상태 변경';
          body = `이슈 상태가 변경되었습니다: ${change.issue.key} - ${change.previousStatus} → ${change.issue.fields.status.name}`;
          break;
        case 'mentioned':
          title = '멘션 알림';
          body = `멘션되었습니다: ${change.issue.key} - ${change.issue.fields.summary}`;
          break;
      }

      // 로컬 알림 표시
      notificationService.showLocalNotification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: `jira-${change.type}-${change.issue.key}`,
        requireInteraction: true,
        data: {
          issueKey: change.issue.key,
          issueUrl: `${jiraConfig?.baseUrl}/browse/${change.issue.key}`,
          type: change.type
        }
      });
    });
  }, [notificationService, jiraConfig]);

  useEffect(() => {
    // 초기 로드 시 설정 불러오기
    const savedConfig = localStorage.getItem('jira-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setJiraConfig(parsedConfig);
        
        // 저장된 설정으로 서비스 생성
        const service = new JiraService(parsedConfig.baseUrl, parsedConfig.email, parsedConfig.apiToken);
        setJiraService(service);
        pollingService.setJiraService(service);
        setIsConfigOpen(false);
      } catch (error) {
        console.error('설정 불러오기 실패:', error);
        setIsConfigOpen(true);
      }
    } else {
      setIsConfigOpen(true);
    }

    // 알림 서비스 초기화
    notificationService.initialize().then(success => {
      if (success) {
        console.log('Notification service initialized');
      }
    });

    // 폴링 서비스 변경사항 콜백 등록
    pollingService.onChanges(handleIssueChanges);

    // 컴포넌트 언마운트 시 정리
    return () => {
      pollingService.offChanges(handleIssueChanges);
    };
  }, [handleIssueChanges, notificationService, pollingService]);

  const handleConfigChange = (config: JiraConfig | null) => {
    setJiraConfig(config);
    if (config) {
      setIsConfigOpen(false);
    }
  };

  const handleServiceChange = (service: JiraService | null) => {
    setJiraService(service);
    pollingService.setJiraService(service);
  };

  const getFilterTitle = (filter: IssueFilter) => {
    if (filter === 'all') {
      return '전체';
    }
    if (filter === 'mentioned') {
      return '멘션됨';
    }
    
    const statusGroup = statusGroups.find(group => group.status === filter);
    return statusGroup ? statusGroup.displayName : filter;
  };

  const getFilterCount = (filter: IssueFilter) => {
    if (filter === 'all') {
      return statusGroups.reduce((total, group) => total + group.count, 0);
    }
    if (filter === 'mentioned') {
      // 멘션됨은 별도 API 호출이므로 0으로 표시
      // 실제 개수는 IssueList에서 관리됨
      return 0;
    }
    
    const statusGroup = statusGroups.find(group => group.status === filter);
    return statusGroup ? statusGroup.count : 0;
  };

  // 탭 순서 저장
  const saveTabOrder = (orderedGroups: StatusGroup[]) => {
    const order = orderedGroups.map(group => group.status);
    localStorage.setItem('jira-tab-order', JSON.stringify(order));
  };

  // 탭 순서 불러오기
  const loadTabOrder = (): string[] => {
    const saved = localStorage.getItem('jira-tab-order');
    return saved ? JSON.parse(saved) : [];
  };

  // 탭 순서 적용
  const applyTabOrder = useCallback((groups: StatusGroup[]) => {
    const savedOrder = loadTabOrder();
    if (savedOrder.length === 0) return groups;

    const orderedGroups: StatusGroup[] = [];
    const remainingGroups = [...groups];

    // 저장된 순서대로 정렬
    savedOrder.forEach(status => {
      const groupIndex = remainingGroups.findIndex(g => g.status === status);
      if (groupIndex !== -1) {
        orderedGroups.push(remainingGroups[groupIndex]);
        remainingGroups.splice(groupIndex, 1);
      }
    });

    // 남은 그룹들을 끝에 추가
    orderedGroups.push(...remainingGroups);
    return orderedGroups;
  }, []);
  
  // 상태 그룹 업데이트 핸들러
  const handleStatusGroupsUpdate = useCallback((groups: StatusGroup[]) => {
    const orderedGroups = applyTabOrder(groups);
    setStatusGroups(orderedGroups);
  }, [applyTabOrder]);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTab(tabId);
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    
    if (!draggedTab || draggedTab === targetTabId) return;

    const newGroups = [...statusGroups];
    const draggedIndex = newGroups.findIndex(g => g.status === draggedTab);
    const targetIndex = newGroups.findIndex(g => g.status === targetTabId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // 탭 순서 변경
      const draggedGroup = newGroups[draggedIndex];
      newGroups.splice(draggedIndex, 1);
      newGroups.splice(targetIndex, 0, draggedGroup);
      
      setStatusGroups(newGroups);
      saveTabOrder(newGroups);
    }

    setDraggedTab(null);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔔 Jira 알림</h1>
          <p>Jira에서 멘션되거나 담당인 이슈들을 확인하세요</p>
        </div>
        <div className="header-buttons">
          <button 
            className="notification-button"
            onClick={() => setIsNotificationSettingsOpen(true)}
            title="알림 설정"
          >
            🔔
          </button>
          <button 
            className="config-button"
            onClick={() => setIsConfigOpen(true)}
            title="설정"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="app-main">
        {isConfigOpen ? (
          <JiraConfigComponent
            onConfigChange={handleConfigChange}
            onServiceChange={handleServiceChange}
          />
        ) : (
          <>
            <div className="filter-tabs">
              <button
                key="all"
                className={`filter-tab ${currentFilter === 'all' ? 'active' : ''} ${draggedTab === 'all' ? 'dragging' : ''} ${dragOverTab === 'all' ? 'drag-over' : ''}`}
                onClick={() => setCurrentFilter('all')}
                draggable
                onDragStart={(e) => handleDragStart(e, 'all')}
                onDragOver={(e) => handleDragOver(e, 'all')}
                onDrop={(e) => handleDrop(e, 'all')}
                onDragEnd={handleDragEnd}
                title="드래그하여 탭 순서 변경"
              >
                {getFilterTitle('all')} ({getFilterCount('all')})
              </button>
              
              <button
                key="mentioned"
                className={`filter-tab mention-tab ${currentFilter === 'mentioned' ? 'active' : ''} ${draggedTab === 'mentioned' ? 'dragging' : ''} ${dragOverTab === 'mentioned' ? 'drag-over' : ''}`}
                onClick={() => setCurrentFilter('mentioned')}
                draggable
                onDragStart={(e) => handleDragStart(e, 'mentioned')}
                onDragOver={(e) => handleDragOver(e, 'mentioned')}
                onDrop={(e) => handleDrop(e, 'mentioned')}
                onDragEnd={handleDragEnd}
                title="드래그하여 탭 순서 변경"
              >
                💬 {getFilterTitle('mentioned')}
              </button>
              
              {statusGroups.map((group) => (
                <button
                  key={group.status}
                  className={`filter-tab ${currentFilter === group.status ? 'active' : ''} ${draggedTab === group.status ? 'dragging' : ''} ${dragOverTab === group.status ? 'drag-over' : ''}`}
                  onClick={() => setCurrentFilter(group.status)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, group.status)}
                  onDragOver={(e) => handleDragOver(e, group.status)}
                  onDrop={(e) => handleDrop(e, group.status)}
                  onDragEnd={handleDragEnd}
                  title="드래그하여 탭 순서 변경"
                >
                  {group.displayName} ({group.count})
                </button>
              ))}
            </div>

            <IssueList
              jiraService={jiraService}
              filter={currentFilter}
              onStatusGroupsUpdate={handleStatusGroupsUpdate}
              currentUserEmail={jiraConfig?.email}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Jira 알림 앱 - 멘션된 이슈와 담당 이슈를 한눈에 확인하세요
        </p>
      </footer>

      {/* 알림 설정 모달 */}
      {isNotificationSettingsOpen && (
        <NotificationSettings
          onClose={() => setIsNotificationSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;