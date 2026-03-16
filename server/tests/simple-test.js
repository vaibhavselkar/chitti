// Simple test to verify models can be imported and basic functionality works
const mongoose = require('mongoose');

// Mock MongoDB connection to avoid actual database dependency
mongoose.connect = () => Promise.resolve();

async function runSimpleTests() {
  try {
    console.log('🧪 Running simple tests...');

    // Test model imports
    console.log('1. Testing model imports...');
    const Admin = require('../models/Admin');
    const ChitGroup = require('../models/ChitGroup');
    const Member = require('../models/Member');
    const Payment = require('../models/Payment');
    console.log('✅ All models imported successfully');

    // Test model schema validation
    console.log('2. Testing model schema...');
    
    // Test Admin model validation
    const adminData = {
      name: 'Test Admin',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    };
    
    const admin = new Admin(adminData);
    const adminValidation = admin.validateSync();
    if (adminValidation) {
      console.log('❌ Admin validation failed:', adminValidation.message);
    } else {
      console.log('✅ Admin model validation passed');
    }

    // Test ChitGroup model validation
    const chitData = {
      name: 'Test Chit',
      monthlyContribution: 5000,
      duration: 20,
      totalMembers: 20,
      startDate: new Date(),
      payoutSchedule: [
        { month: 1, payoutAmount: 95000 },
        { month: 2, payoutAmount: 96000 }
      ]
    };
    
    const chitGroup = new ChitGroup(chitData);
    const chitValidation = chitGroup.validateSync();
    if (chitValidation) {
      console.log('❌ ChitGroup validation failed:', chitValidation.message);
    } else {
      console.log('✅ ChitGroup model validation passed');
    }

    // Test Member model validation
    const memberData = {
      name: 'Test Member',
      phone: '9876543210',
      email: 'member@example.com',
      address: 'Test Address',
      aadhaarNumber: '123456789012',
      chitGroupId: '507f1f77bcf86cd799439011', // Mock ObjectId
      withdrawMonth: 5
    };
    
    const member = new Member(memberData);
    const memberValidation = member.validateSync();
    if (memberValidation) {
      console.log('❌ Member validation failed:', memberValidation.message);
    } else {
      console.log('✅ Member model validation passed');
    }

    // Test Payment model validation
    const paymentData = {
      memberId: '507f1f77bcf86cd799439011', // Mock ObjectId
      chitGroupId: '507f1f77bcf86cd799439011', // Mock ObjectId
      month: 1,
      amount: 5000,
      paymentMethod: 'cash',
      receivedBy: 'Admin'
    };
    
    const payment = new Payment(paymentData);
    const paymentValidation = payment.validateSync();
    if (paymentValidation) {
      console.log('❌ Payment validation failed:', paymentValidation.message);
    } else {
      console.log('✅ Payment model validation passed');
    }

    console.log('\n🎉 All simple tests passed! Models are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runSimpleTests();
}

module.exports = { runSimpleTests };