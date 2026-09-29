const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const envPath = path.resolve('../../.env');
const env = fs.readFileSync(envPath, 'utf8');
const uriMatch = env.match(/MONGODB_URI=(.*)/);
const MONGODB_URI = uriMatch[1].trim().replace(/^"|"$/g, '');

const OrderSchema = new mongoose.Schema({ id: String }, { strict: false });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function clear() {
  try {
    await mongoose.connect(MONGODB_URI);
    await Order.deleteMany({});
    console.log('Orders cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
clear();
