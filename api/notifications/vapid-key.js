const { setCorsHeaders, handleOptions, initVapid } = require('../_utils');

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

  const VAPID_PUBLIC_KEY = initVapid();
  
  setCorsHeaders(res);
  res.json({ publicKey: VAPID_PUBLIC_KEY });
};

