const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 2001;

// CORS 설정
app.use(cors({
  origin: ['http://localhost:2001', 'http://localhost:3000'],
  credentials: true
}));

// JSON 파싱 미들웨어
app.use(express.json());

// Jira API 연결 테스트 프록시
app.post('/api/jira/test-connection', async (req, res) => {
  try {
    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다.' 
      });
    }

    const jiraUrl = baseUrl.replace(/\/$/, '');
    const response = await axios.get(`${jiraUrl}/rest/api/3/myself`, {
      auth: {
        username: email,
        password: apiToken
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    res.json({ 
      success: true, 
      data: response.data
    });
  } catch (error) {
    console.error('Jira 연결 테스트 실패:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Jira 연결에 실패했습니다.',
      error: error.response?.data?.errorMessages || [error.message]
    });
  }
});

// Jira API 검색 프록시
app.post('/api/jira/search', async (req, res) => {
  try {
    const { baseUrl, email, apiToken, jql, fields, maxResults } = req.body;

    if (!baseUrl || !email || !apiToken || !jql) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다.' 
      });
    }

    const jiraUrl = baseUrl.replace(/\/$/, '');
    
    // Basic Auth 헤더 생성
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    // 쿼리 파라미터 구성
    const params = new URLSearchParams({
      jql: jql,
      fields: fields || 'summary,status,assignee,reporter,created,updated,priority,issuetype,description',
      maxResults: (maxResults || 50).toString(),
      expand: 'changelog'
    });

    const response = await axios.get(`${jiraUrl}/rest/api/3/search/jql?${params.toString()}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    console.log('Jira API Response:', JSON.stringify(response.data, null, 2));

    res.json({ 
      success: true, 
      data: response.data
    });
  } catch (error) {
    console.error('Jira 검색 실패:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Jira 검색에 실패했습니다.',
      error: error.response?.data?.errorMessages || [error.message]
    });
  }
});

// React 앱 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../build')));

// React 앱을 위한 SPA 라우팅
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Jira 알림 개발 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 프론트엔드: http://localhost:${PORT}`);
  console.log(`🔗 API 엔드포인트: http://localhost:${PORT}/api/jira/*`);
  console.log(`🔄 파일 변경 감지 활성화됨`);
});
