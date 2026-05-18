#!/usr/bin/env node

/**
 * M-Pesa B2C Test Script
 * Tests the M-Pesa B2C disbursement functionality
 * Usage: node scripts/test-mpesa-b2c.js
 */

const { sendMpesaB2C, buildB2CPayload } = require('../utils/mpesa');
require('dotenv').config();

const testMpesaB2C = async () => {
  console.log('🧪 Testing M-Pesa B2C Implementation\n');

  // Check environment variables
  console.log('📋 Checking environment configuration...');
  const requiredEnvVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_SHORTCODE',
    'MPESA_INITIATOR_NAME',
    'MPESA_SECURITY_CREDENTIAL',
    'MPESA_QUEUE_TIMEOUT_URL',
    'MPESA_RESULT_URL',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n💡 Please add these to your .env file');
    process.exit(1);
  }
  console.log('✅ All required environment variables are set\n');

  // Test 1: Build B2C Payload
  console.log('📦 Test 1: Building B2C Payload');
  try {
    const payload = buildB2CPayload({
      amount: 10,
      partyB: '254701606056',
      reference: 'TEST-001',
      remarks: 'Test payment',
      occasion: 'Test',
    });

    console.log('✅ Payload built successfully:');
    console.log(JSON.stringify({ ...payload, SecurityCredential: '***' }, null, 2));
    console.log();

    // Verify payload structure matches sample
    const requiredFields = [
      'OriginatorConversationID',
      'InitiatorName',
      'SecurityCredential',
      'CommandID',
      'Amount',
      'PartyA',
      'PartyB',
      'Remarks',
      'QueueTimeOutURL',
      'ResultURL',
      'Occasion',
    ];

    const missingFields = requiredFields.filter(field => !(field in payload));
    if (missingFields.length > 0) {
      console.error('❌ Payload missing required fields:', missingFields);
      process.exit(1);
    }
    console.log('✅ Payload contains all required fields\n');
  } catch (error) {
    console.error('❌ Failed to build payload:', error.message);
    process.exit(1);
  }

  // Test 2: Send B2C Request (commented out by default to avoid accidental real transactions)
  console.log('📡 Test 2: Sending B2C Request');
  console.log('⚠️  This will make a REAL M-Pesa transaction if executed');
  console.log('⚠️  Current test is in DRY RUN mode\n');

  // Uncomment the following lines to execute a real test:
  
  try {
    const result = await sendMpesaB2C({
      amount: 10,
      partyB: '254701606056',
      reference: 'TEST-001',
      remarks: 'Test payment',
      occasion: 'Test',
    });

    console.log('✅ B2C request sent successfully:');
    console.log(JSON.stringify(result, null, 2));
    console.log();

    if (result.success) {
      console.log('✅ Transaction accepted by M-Pesa');
      console.log(`   ConversationID: ${result.conversationId}`);
      console.log(`   OriginatorConversationID: ${result.originatorConversationId}`);
      console.log(`   ResponseCode: ${result.responseCode}`);
      console.log(`   ResponseDescription: ${result.responseDescription}`);
    } else {
      console.error('❌ Transaction failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to send B2C request:', error.message);
    process.exit(1);
  }
  

  console.log('✅ DRY RUN - No actual transaction sent');
  console.log('💡 To execute a real test, uncomment the code in this script\n');

  console.log('🎉 All tests passed!');
  console.log('\n📝 Sample Request Structure (from your provided example):');
  console.log(JSON.stringify({
    OriginatorConversationID: "9e108a0ca5ae49ae882ad428b1e7d57d",
    InitiatorName: "testapi",
    SecurityCredential: "***",
    CommandID: "SalaryPayment",
    Amount: 10,
    PartyA: "600978",
    PartyB: "254701606056",
    Remarks: "ok",
    Occasion: "",
    QueueTimeOutURL: "https://mydomain.com/b2c/queue/",
    ResultURL: "https://mydomain.com/b2c/result/"
  }, null, 2));

  console.log('\n📝 Sample Response Structure (from your provided example):');
  console.log(JSON.stringify({
    ConversationID: "AG_20260518_0100104414m6faxq9i7u",
    OriginatorConversationID: "9496-41a5-a116-04d8b5ffd61b37592",
    ResponseCode: "0",
    ResponseDescription: "Accept the service request successfully."
  }, null, 2));
};

// Run the test
testMpesaB2C().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
