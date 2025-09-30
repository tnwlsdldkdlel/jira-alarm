const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 2001;

// Web Push 설정
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BChsZnsKWxXHTuNZAmUlzuBvGvZsXEkb4-c92yJJBtOXDCiU0Q9-lZaHcFEt3Vc9eRNBsMlw67JJ3bO7nRC6ab4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'ooDfGWjMJSETlSDyIleK3p6TX1Jy_Y41dSNIHwshVy0';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// 구독 정보 저장 (실제 환경에서는 데이터베이스 사용)
let subscriptions = [];

// CORS 설정
app.use(cors({
  origin: ['http://localhost:2001', 'http://localhost:3000'],
  credentials: true
}));

// JSON 파싱
app.use(express.json());

// 정적 파일 서빙 (빌드된 React 앱)
app.use(express.static(path.join(__dirname, './build')));

// Jira API 프록시 엔드포인트
app.post('/api/jira/test-connection', async (req, res) => {
  try {
    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({ 
        success: false, 
        message: '모든 필드를 입력해주세요.' 
      });
    }

    const jiraUrl = baseUrl.replace(/\/$/, '');
    const response = await axios.get(`${jiraUrl}/rest/api/3/myself`, {
      auth: {
        username: email,
        password: apiToken
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json({ 
      success: true, 
      message: 'Jira 연결에 성공했습니다!',
      user: response.data
    });
  } catch (error) {
    console.error('Jira 연결 테스트 실패:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Jira 연결에 실패했습니다. 설정을 확인해주세요.',
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

// VAPID 공개 키 제공
app.get('/api/notifications/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Push 구독 등록
app.post('/api/notifications/subscribe', (req, res) => {
  try {
    const subscription = req.body;
    
    // 중복 구독 확인
    const existingIndex = subscriptions.findIndex(sub => 
      sub.endpoint === subscription.endpoint
    );
    
    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription;
    } else {
      subscriptions.push(subscription);
    }
    
    console.log('New subscription added:', subscription.endpoint);
    res.json({ success: true, message: '구독이 등록되었습니다.' });
  } catch (error) {
    console.error('Subscription registration failed:', error);
    res.status(500).json({ success: false, message: '구독 등록에 실패했습니다.' });
  }
});

// Push 구독 해제
app.post('/api/notifications/unsubscribe', (req, res) => {
  try {
    const { endpoint } = req.body;
    
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    
    console.log('Subscription removed:', endpoint);
    res.json({ success: true, message: '구독이 해제되었습니다.' });
  } catch (error) {
    console.error('Subscription removal failed:', error);
    res.status(500).json({ success: false, message: '구독 해제에 실패했습니다.' });
  }
});

// 알림 전송 (테스트용)
app.post('/api/notifications/send', (req, res) => {
  try {
    const { title, body, data } = req.body;
    
    const payload = JSON.stringify({
      title: title || 'Jira 알림',
      body: body || '새로운 이슈가 할당되었습니다.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'jira-notification',
      requireInteraction: true,
      data: data || {}
    });
    
    const promises = subscriptions.map(subscription => {
      return webpush.sendNotification(subscription, payload)
        .catch(error => {
          console.error('Push notification failed:', error);
          // 실패한 구독 제거
          subscriptions = subscriptions.filter(sub => sub.endpoint !== subscription.endpoint);
        });
    });
    
    Promise.all(promises).then(() => {
      res.json({ 
        success: true, 
        message: `${subscriptions.length}명에게 알림을 전송했습니다.` 
      });
    });
  } catch (error) {
    console.error('Send notification failed:', error);
    res.status(500).json({ success: false, message: '알림 전송에 실패했습니다.' });
  }
});

// 구독 상태 확인
app.get('/api/notifications/subscriptions', (req, res) => {
  res.json({ 
    success: true, 
    count: subscriptions.length,
    subscriptions: subscriptions.map(sub => ({ endpoint: sub.endpoint }))
  });
});

// React 앱 라우팅 (SPA 지원)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Jira 알림 프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 프론트엔드: http://localhost:${PORT}`);
  console.log(`🔗 API 엔드포인트: http://localhost:${PORT}/api/jira/*`);
});
