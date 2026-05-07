const axios = require('axios');

const getMpesaConfig = () => {
  const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_OAUTH_URL,
    MPESA_B2C_URL,
    MPESA_SHORTCODE,
    MPESA_INITIATOR_NAME,
    MPESA_INITIATOR_PASSWORD,
    MPESA_SECURITY_CREDENTIAL,
    MPESA_QUEUE_TIMEOUT_URL,
    MPESA_RESULT_URL,
  } = process.env;

  return {
    consumerKey: MPESA_CONSUMER_KEY,
    consumerSecret: MPESA_CONSUMER_SECRET,
    oauthUrl: MPESA_OAUTH_URL || 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    b2cUrl: MPESA_B2C_URL || 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
    shortcode: MPESA_SHORTCODE,
    initiatorName: MPESA_INITIATOR_NAME,
    initiatorPassword: MPESA_INITIATOR_PASSWORD,
    securityCredential: MPESA_SECURITY_CREDENTIAL,
    queueTimeoutUrl: MPESA_QUEUE_TIMEOUT_URL || 'https://ubuntu-hrms-epmc.onrender.com/api/payroll/mpesa-timeout',
    resultUrl: MPESA_RESULT_URL || 'https://ubuntu-hrms-epmc.onrender.com/api/payroll/mpesa-callback',
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
  const { securityCredential, initiatorPassword } = getMpesaConfig();
  return securityCredential || initiatorPassword;
};

const buildB2CPayload = ({ amount, partyB, reference }) => {
  const config = getMpesaConfig();
  const securityCredential = getSecurityCredential();

  if (!config.shortcode || !config.initiatorName || !securityCredential) {
    throw new Error('Missing M-Pesa B2C configuration');
  }

  return {
    InitiatorName: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'SalaryPayment',
    Amount: Number(amount),
    PartyA: config.shortcode,
    PartyB: String(partyB),
    Remarks: reference ? `Payroll disbursement ${reference}` : 'Payroll disbursement',
    QueueTimeOutURL: config.queueTimeoutUrl,
    ResultURL: config.resultUrl,
    Occasion: reference || 'PayrollDisbursement',
  };
};

const sendMpesaB2C = async ({ amount, partyB, reference }) => {
  const config = getMpesaConfig();
  const accessToken = await getMpesaAccessToken();
  const payload = buildB2CPayload({ amount, partyB, reference });

  console.log('[M-Pesa] B2C request payload', {
    amount: payload.Amount,
    partyB: payload.PartyB,
    reference: payload.Occasion,
  });

  const response = await axios.post(config.b2cUrl, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

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
};

module.exports = {
  getMpesaAccessToken,
  sendMpesaB2C,
  buildB2CPayload,
};
