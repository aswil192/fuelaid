const mongoose = require('mongoose');
const Payment = require('./models/payment.js');
const User = require('./models/user.js');
const ServiceRequest = require('./models/serviceRequest.js');

async function resetPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadaid');
    
    // Delete all payments
    await Payment.deleteMany({});
    console.log('✓ Payments reset');
    
    // Mark all service requests as unpaid
    await ServiceRequest.updateMany({}, { isPaid: false });
    console.log('✓ Service requests marked as unpaid');
    
    // Reset provider earnings and set commission to 40%
    await User.updateMany(
      { role: { $in: ['mechanic', 'fueldeliveryboy'] } },
      { 
        totalEarnings: 0,
        pendingEarnings: 0,
        commissionRate: 40
      }
    );
    console.log('✓ Provider earnings reset to 0');
    console.log('✓ Commission rate changed to 40%');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetPayments();
