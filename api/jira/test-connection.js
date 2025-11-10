const axios = require('axios');
const { setCorsHeaders, handleOptions } = require('../_utils');

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
    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      setCorsHeaders(res);
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

    setCorsHeaders(res);
    res.json({ 
      success: true, 
      message: 'Jira 연결에 성공했습니다!',
      user: response.data
    });
  } catch (error) {
    console.error('Jira 연결 테스트 실패:', error.response?.data || error.message);
    setCorsHeaders(res);
    res.status(500).json({ 
      success: false, 
      message: 'Jira 연결에 실패했습니다. 설정을 확인해주세요.',
      error: error.response?.data?.errorMessages || [error.message]
    });
  }
};

