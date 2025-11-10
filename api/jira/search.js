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
    const { baseUrl, email, apiToken, jql, fields, maxResults } = req.body;

    if (!baseUrl || !email || !apiToken || !jql) {
      setCorsHeaders(res);
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

    setCorsHeaders(res);
    res.json({ 
      success: true, 
      data: response.data
    });
  } catch (error) {
    console.error('Jira 검색 실패:', error.response?.data || error.message);
    setCorsHeaders(res);
    res.status(500).json({ 
      success: false, 
      message: 'Jira 검색에 실패했습니다.',
      error: error.response?.data?.errorMessages || [error.message]
    });
  }
};

