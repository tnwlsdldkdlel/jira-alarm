const webpush = require('web-push');

// VAPID 설정 초기화
const initVapid = () => {
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BChsZnsKWxXHTuNZAmUlzuBvGvZsXEkb4-c92yJJBtOXDCiU0Q9-lZaHcFEt3Vc9eRNBsMlw67JJ3bO7nRC6ab4';
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'ooDfGWjMJSETlSDyIleK3p6TX1Jy_Y41dSNIHwshVy0';
  const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@example.com';
  
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return VAPID_PUBLIC_KEY;
};

// CORS 헤더 설정
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// OPTIONS 요청 처리
const handleOptions = (res) => {
  setCorsHeaders(res);
  res.status(200).end();
};

// 구독 정보 저장 (간단한 메모리 저장소 - 프로덕션에서는 데이터베이스 사용 권장)
// 주의: Vercel Serverless Functions는 stateless이므로 실제로는 외부 저장소 필요
let subscriptions = [];

const getSubscriptions = () => subscriptions;
const addSubscription = (subscription) => {
  const existingIndex = subscriptions.findIndex(sub => 
    sub.endpoint === subscription.endpoint
  );
  if (existingIndex >= 0) {
    subscriptions[existingIndex] = subscription;
  } else {
    subscriptions.push(subscription);
  }
};
const removeSubscription = (endpoint) => {
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
};

module.exports = {
  initVapid,
  setCorsHeaders,
  handleOptions,
  getSubscriptions,
  addSubscription,
  removeSubscription
};

