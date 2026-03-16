const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const ChitGroup = require('../models/ChitGroup');
const Member = require('../models/Member');
const Payment = require('../models/Payment');

// Simple test to verify models work
async function runTests() {
  try {
    console.log('🧪 Running basic tests...');

    // Test Admin model
    console.log('1. Testing Admin model...');
    const admin = new Admin({
      name: 'Test Admin',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });
    
    await admin.save();
    console.log('✅ Admin created successfully');

    // Test ChitGroup model
    console.log('2. Testing ChitGroup model...');
    const chitGroup = new ChitGroup({
      name: 'Test Chit',
      monthlyContribution: 5000,
      duration: 20,
      totalMembers: 20,
      startDate: new Date(),
      payoutSchedule: [
        { month: 1, payoutAmount: 95000 },
        { month: 2, payoutAmount: 96000 }
      ]
    });
    
    await chitGroup.save();
    console.log('✅ ChitGroup created successfully');

    // Test Member model
    console.log('3. Testing Member model...');
    const member = new Member({
      name: 'Test Member',
      phone: '9876543210',
      email: 'member@example.com',
      address: 'Test Address',
      aadhaarNumber: '123456789012',
      chitGroupId: chitGroup._id,
      withdrawMonth: 5
    });
    
    await member.save();
    console.log('✅ Member created successfully');

    // Test Payment model
    console.log('4. Testing Payment model...');
    const payment = new Payment({
      memberId: member._id,
      chitGroupId: chitGroup._id,
      month: 1,
      amount: 5000,
      paymentMethod: 'cash',
      receivedBy: 'Admin'
    });
    
    await payment.save();
    console.log('✅ Payment created successfully');

    // Test relationships
    console.log('5. Testing relationships...');
    const populatedPayment = await Payment.findById(payment._id)
      .populate('memberId', 'name phone')
      .populate('chitGroupId', 'name');
    
    console.log('✅ Payment with populated data:', {
      memberName: populatedPayment.memberId.name,
      chitName: populatedPayment.chitGroupId.name,
      amount: populatedPayment.amount
    });

    console.log('\n🎉 All tests passed! The application is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    await mongoose.connection.close();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };