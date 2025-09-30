import React, { useState, useEffect } from 'react';
import { NotificationService } from '../services/notificationService';
import { JiraPollingService, PollingConfig } from '../services/jiraPollingService';
import './NotificationSettings.css';

interface NotificationSettingsProps {
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [notificationService] = useState(() => NotificationService.getInstance());
  const [pollingService] = useState(() => JiraPollingService.getInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pollingConfig, setPollingConfig] = useState<PollingConfig>({
    interval: 30000,
    enabled: false,
    checkNewIssues: true,
    checkMentions: true,
    checkStatusChanges: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    initializeServices();
    loadConfig();
  }, []);

  const initializeServices = async () => {
    setIsLoading(true);
    try {
      const initialized = await notificationService.initialize();
      setIsInitialized(initialized);
      
      if (initialized) {
        const subscribed = await notificationService.isSubscribed();
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error('Failed to initialize notification services:', error);
      setMessage('알림 서비스 초기화에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('jira-polling-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setPollingConfig(config);
        pollingService.updateConfig(config);
      } catch (error) {
        console.error('Failed to load polling config:', error);
      }
    }
  };

  const saveConfig = (config: PollingConfig) => {
    localStorage.setItem('jira-polling-config', JSON.stringify(config));
    pollingService.updateConfig(config);
    setPollingConfig(config);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await notificationService.initialize();
      if (success) {
        setIsInitialized(true);
        setIsSubscribed(true);
        setMessage('알림이 활성화되었습니다!');
      } else {
        setMessage('알림 활성화에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      setMessage('알림 활성화 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await notificationService.unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        setMessage('알림이 비활성화되었습니다.');
      } else {
        setMessage('알림 비활성화에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      setMessage('알림 비활성화 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePollingToggle = () => {
    const newConfig = { ...pollingConfig, enabled: !pollingConfig.enabled };
    saveConfig(newConfig);
    
    if (newConfig.enabled) {
      pollingService.startPolling();
      setMessage('자동 폴링이 시작되었습니다.');
    } else {
      pollingService.stopPolling();
      setMessage('자동 폴링이 중지되었습니다.');
    }
  };

  const handleIntervalChange = (interval: number) => {
    const newConfig = { ...pollingConfig, interval };
    saveConfig(newConfig);
  };

  const handleCheckboxChange = (key: keyof PollingConfig, value: boolean) => {
    const newConfig = { ...pollingConfig, [key]: value };
    saveConfig(newConfig);
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.showLocalNotification(
        '테스트 알림',
        {
          body: 'Jira 알림이 정상적으로 작동합니다!',
          icon: '/logo192.png'
        }
      );
      setMessage('테스트 알림을 전송했습니다.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setMessage('테스트 알림 전송에 실패했습니다.');
    }
  };

  const intervalOptions = [
    { value: 10000, label: '10초' },
    { value: 30000, label: '30초' },
    { value: 60000, label: '1분' },
    { value: 300000, label: '5분' },
    { value: 600000, label: '10분' }
  ];

  return (
    <div className="notification-settings-overlay">
      <div className="notification-settings-modal">
        <div className="notification-settings-header">
          <h2>🔔 알림 설정</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="notification-settings-content">
          {message && (
            <div className={`message ${message.includes('실패') || message.includes('오류') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Web Push 알림 설정 */}
          <div className="setting-section">
            <h3>웹 푸시 알림</h3>
            <div className="setting-item">
              <span>알림 상태: {isSubscribed ? '✅ 활성화' : '❌ 비활성화'}</span>
              {!isSubscribed ? (
                <button 
                  className="enable-button"
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '알림 활성화'}
                </button>
              ) : (
                <button 
                  className="disable-button"
                  onClick={handleDisableNotifications}
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '알림 비활성화'}
                </button>
              )}
            </div>
            <div className="setting-item">
              <button 
                className="test-button"
                onClick={handleTestNotification}
                disabled={!isSubscribed}
              >
                테스트 알림 전송
              </button>
            </div>
          </div>

          {/* 자동 폴링 설정 */}
          <div className="setting-section">
            <h3>자동 폴링 설정</h3>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={pollingConfig.enabled}
                  onChange={handlePollingToggle}
                />
                <span>자동 폴링 활성화</span>
              </label>
            </div>
            
            {pollingConfig.enabled && (
              <>
                <div className="setting-item">
                  <label>폴링 간격:</label>
                  <select
                    value={pollingConfig.interval}
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  >
                    {intervalOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-item">
                  <h4>감지할 변경사항:</h4>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={pollingConfig.checkNewIssues}
                      onChange={(e) => handleCheckboxChange('checkNewIssues', e.target.checked)}
                    />
                    <span>새로 할당된 이슈</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={pollingConfig.checkStatusChanges}
                      onChange={(e) => handleCheckboxChange('checkStatusChanges', e.target.checked)}
                    />
                    <span>상태 변경</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={pollingConfig.checkMentions}
                      onChange={(e) => handleCheckboxChange('checkMentions', e.target.checked)}
                    />
                    <span>멘션 (향후 구현)</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* 현재 상태 */}
          <div className="setting-section">
            <h3>현재 상태</h3>
            <div className="status-info">
              <p>알림 서비스: {isInitialized ? '✅ 초기화됨' : '❌ 초기화 안됨'}</p>
              <p>구독 상태: {isSubscribed ? '✅ 구독됨' : '❌ 구독 안됨'}</p>
              <p>폴링 상태: {pollingService.isPolling() ? '✅ 실행 중' : '❌ 중지됨'}</p>
            </div>
          </div>
        </div>

        <div className="notification-settings-footer">
          <button className="close-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
