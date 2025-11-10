const { setCorsHeaders, handleOptions, getSubscriptions } = require('../_utils');

module.exports = async (req, res) => {
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    setCorsHeaders(res);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const subscriptions = getSubscriptions();
  
  setCorsHeaders(res);
  res.json({ 
    success: true, 
    count: subscriptions.length,
    subscriptions: subscriptions.map(sub => ({ endpoint: sub.endpoint }))
  });
};

