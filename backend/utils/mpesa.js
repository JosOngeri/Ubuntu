const axios = require('axios');

const getMpesaConfig = () => {
  const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_ENVIRONMENT,
    MPESA_BASE_URL,
    MPESA_B2C_URL,
    MPESA_OAUTH_URL,
    MPESA_SHORTCODE,
    MPESA_INITIATOR_NAME,
    MPESA_SECURITY_CREDENTIAL,
    MPESA_QUEUE_TIMEOUT_URL,
    MPESA_RESULT_URL,
  } = process.env;

  // Use environment to determine base URLs
  const isProduction = String(MPESA_ENVIRONMENT).toLowerCase() === 'production';
  const baseUrl = MPESA_BASE_URL || (isProduction
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke');

  return {
    consumerKey: MPESA_CONSUMER_KEY,
    consumerSecret: MPESA_CONSUMER_SECRET,
    oauthUrl: MPESA_OAUTH_URL || `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    b2cUrl: MPESA_B2C_URL || `${baseUrl}/mpesa/b2c/v1/paymentrequest`,
    shortcode: MPESA_SHORTCODE,
    initiatorName: MPESA_INITIATOR_NAME,
    securityCredential: MPESA_SECURITY_CREDENTIAL, // Must be encrypted!
    queueTimeoutUrl: MPESA_QUEUE_TIMEOUT_URL,
    resultUrl: MPESA_RESULT_URL,
  };
};

const getMpesaAccessToken = async () => {
  const { consumerKey, consumerSecret, oauthUrl } = getMpesaConfig();
  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing M-Pesa consumer key or secret');
  }

  const token = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const response = await axios.get(oauthUrl, {
    headers: {
      Authorization: `Basic ${token}`,
      'Cache-Control': 'no-cache',
    },
    timeout: 10000,
  });

  return response.data.access_token;
};

const getSecurityCredential = () => {
  const { securityCredential } = getMpesaConfig();
  if (!securityCredential) {
    throw new Error('Missing MPESA_SECURITY_CREDENTIAL (must be encrypted password)');
  }
  return securityCredential;
};

const buildB2CPayload = ({ amount, partyB, reference, commandId = 'SalaryPayment', remarks = '', occasion = '' }) => {
  const config = getMpesaConfig();
  const securityCredential = getSecurityCredential();

  if (!config.shortcode || !config.initiatorName || !securityCredential) {
    throw new Error('Missing M-Pesa B2C configuration');
  }

  // Generate a unique OriginatorConversationID if not provided
  const originatorConversationId = `HRMS_${Date.now()}_${Math.floor(Math.random()*10000)}`;

  return {
    OriginatorConversationID: originatorConversationId,
    InitiatorName: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: commandId,
    Amount: Number(amount),
    PartyA: config.shortcode,
    PartyB: String(partyB),
    Remarks: remarks || (reference ? `Payroll disbursement ${reference}` : 'Payroll disbursement'),
    QueueTimeOutURL: config.queueTimeoutUrl,
    ResultURL: config.resultUrl,
    Occasion: occasion || reference || 'PayrollDisbursement',
  };
};

const sendMpesaB2C = async ({ amount, partyB, reference, commandId, remarks, occasion }) => {
  const config = getMpesaConfig();
  const accessToken = await getMpesaAccessToken();
  const payload = buildB2CPayload({ amount, partyB, reference, commandId, remarks, occasion });

  try {
    console.log('[M-Pesa] B2C request payload', {
      ...payload,
      SecurityCredential: '***', // Hide sensitive info
    });

    const response = await axios.post(config.b2cUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log('[M-Pesa] B2C response', response.data);

    return {
      success: true,
      response: response.data,
      accessToken,
      requestPayload: payload,
      conversationId: response.data?.ConversationID || response.data?.conversation_id || null,
      originatorConversationId: response.data?.OriginatorConversationID || null,
      responseCode: response.data?.ResponseCode || null,
      responseDescription: response.data?.ResponseDescription || null,
    };
  } catch (err) {
    console.error('[M-Pesa] B2C error', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data || err.message,
      requestPayload: payload,
    };
  }
};

module.exports = {
  getMpesaAccessToken,
  sendMpesaB2C,
  buildB2CPayload,
};
