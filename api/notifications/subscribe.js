const { setCorsHeaders, handleOptions, addSubscription } = require('../_utils');

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
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      setCorsHeaders(res);
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }

    addSubscription(subscription);
    
    console.log('New subscription added:', subscription.endpoint);
    setCorsHeaders(res);
    res.json({ success: true, message: '구독이 등록되었습니다.' });
  } catch (error) {
    console.error('Subscription registration failed:', error);
    setCorsHeaders(res);
    res.status(500).json({ success: false, message: '구독 등록에 실패했습니다.' });
  }
};

