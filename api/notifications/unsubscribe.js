const { setCorsHeaders, handleOptions, removeSubscription } = require('../_utils');

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
    const { endpoint } = req.body;
    
    if (!endpoint) {
      setCorsHeaders(res);
      return res.status(400).json({ success: false, message: 'Endpoint is required' });
    }

    removeSubscription(endpoint);
    
    console.log('Subscription removed:', endpoint);
    setCorsHeaders(res);
    res.json({ success: true, message: '구독이 해제되었습니다.' });
  } catch (error) {
    console.error('Subscription removal failed:', error);
    setCorsHeaders(res);
    res.status(500).json({ success: false, message: '구독 해제에 실패했습니다.' });
  }
};

