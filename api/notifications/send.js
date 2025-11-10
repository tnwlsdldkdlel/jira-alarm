const webpush = require('web-push');
const { setCorsHeaders, handleOptions, initVapid, getSubscriptions, removeSubscription } = require('../_utils');

module.exports = async (req, res) => {
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    setCorsHeaders(res);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    initVapid();
    
    const { title, body, data } = req.body;
    const subscriptions = getSubscriptions();
    
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
          removeSubscription(subscription.endpoint);
        });
    });
    
    await Promise.all(promises);
    
    setCorsHeaders(res);
    res.json({ 
      success: true, 
      message: `${subscriptions.length}명에게 알림을 전송했습니다.` 
    });
  } catch (error) {
    console.error('Send notification failed:', error);
    setCorsHeaders(res);
    res.status(500).json({ success: false, message: '알림 전송에 실패했습니다.' });
  }
};

