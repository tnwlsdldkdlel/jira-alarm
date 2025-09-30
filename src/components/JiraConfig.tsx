import React, { useState, useEffect } from 'react';
import { JiraConfig } from '../types/jira';
import { JiraService } from '../services/jiraService';
import './JiraConfig.css';

interface JiraConfigProps {
  onConfigChange: (config: JiraConfig | null) => void;
  onServiceChange: (service: JiraService | null) => void;
}

const JiraConfigComponent: React.FC<JiraConfigProps> = ({ onConfigChange, onServiceChange }) => {
  const [config, setConfig] = useState<JiraConfig>({
    baseUrl: '',
    email: '',
    apiToken: ''
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 설정 불러오기
    const savedConfig = localStorage.getItem('jira-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setIsConfigured(true);
        
        // 저장된 설정으로 서비스 생성
        const service = new JiraService(parsedConfig.baseUrl, parsedConfig.email, parsedConfig.apiToken);
        onServiceChange(service);
      } catch (error) {
        console.error('설정 불러오기 실패:', error);
      }
    }
  }, [onServiceChange]);

  const handleInputChange = (field: keyof JiraConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null);
  };

  const testConnection = async () => {
    if (!config.baseUrl || !config.email || !config.apiToken) {
      setTestResult({
        success: false,
        message: '모든 필드를 입력해주세요.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const service = new JiraService(config.baseUrl, config.email, config.apiToken);
      const isConnected = await service.testConnection();
      
      if (isConnected) {
        setTestResult({
          success: true,
          message: 'Jira 연결에 성공했습니다!'
        });
        setIsConfigured(true);
        onServiceChange(service);
        
        // 설정 저장
        localStorage.setItem('jira-config', JSON.stringify(config));
        onConfigChange(config);
      } else {
        setTestResult({
          success: false,
          message: 'Jira 연결에 실패했습니다. 설정을 확인해주세요.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `연결 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const clearConfig = () => {
    setConfig({ baseUrl: '', email: '', apiToken: '' });
    setTestResult(null);
    setIsConfigured(false);
    onServiceChange(null);
    onConfigChange(null);
    localStorage.removeItem('jira-config');
  };

  return (
    <div className="jira-config-container">
      <div className="config-header">
        <h2>Jira 설정</h2>
        {isConfigured && (
          <div className="config-status">
            <span className="status-indicator success">✓ 연결됨</span>
          </div>
        )}
      </div>

      <div className="config-form">
        <div className="form-group">
          <label htmlFor="baseUrl">Jira 서버 URL</label>
          <input
            id="baseUrl"
            type="url"
            value={config.baseUrl}
            onChange={(e) => handleInputChange('baseUrl', e.target.value)}
            placeholder="https://yourcompany.atlassian.net"
            disabled={isTesting}
          />
          <small>예: https://yourcompany.atlassian.net</small>
        </div>

        <div className="form-group">
          <label htmlFor="email">이메일 주소</label>
          <input
            id="email"
            type="email"
            value={config.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your-email@company.com"
            disabled={isTesting}
          />
          <small>Jira 계정 이메일 주소</small>
        </div>

        <div className="form-group">
          <label htmlFor="apiToken">API 토큰</label>
          <input
            id="apiToken"
            type="password"
            value={config.apiToken}
            onChange={(e) => handleInputChange('apiToken', e.target.value)}
            placeholder="API 토큰을 입력하세요"
            disabled={isTesting}
          />
          <small>
            <a 
              href="https://id.atlassian.com/manage-profile/security/api-tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="help-link"
            >
              API 토큰 생성하기
            </a>
          </small>
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            <span className="result-icon">
              {testResult.success ? '✓' : '✗'}
            </span>
            <span className="result-message">{testResult.message}</span>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={testConnection}
            disabled={isTesting || !config.baseUrl || !config.email || !config.apiToken}
            className="test-button"
          >
            {isTesting ? '연결 테스트 중...' : '연결 테스트'}
          </button>
          
          {isConfigured && (
            <button
              type="button"
              onClick={clearConfig}
              className="clear-button"
            >
              설정 초기화
            </button>
          )}
        </div>
      </div>

      <div className="config-help">
        <h3>설정 방법</h3>
        <ol>
          <li>
            <strong>Jira 서버 URL:</strong> 회사의 Jira 서버 주소를 입력하세요.
            <br />
            예: https://yourcompany.atlassian.net
          </li>
          <li>
            <strong>이메일 주소:</strong> Jira 계정의 이메일 주소를 입력하세요.
          </li>
          <li>
            <strong>API 토큰:</strong> 
            <a 
              href="https://id.atlassian.com/manage-profile/security/api-tokens" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Atlassian 계정 관리 페이지
            </a>
            에서 API 토큰을 생성하세요.
          </li>
          <li>
            <strong>연결 테스트:</strong> 모든 정보를 입력한 후 연결 테스트를 실행하세요.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default JiraConfigComponent;
