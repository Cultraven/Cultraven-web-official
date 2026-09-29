const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const envPath = path.resolve('../../.env');
const env = fs.readFileSync(envPath, 'utf8');
const uriMatch = env.match(/MONGODB_URI=(.*)/);
const MONGODB_URI = uriMatch[1].trim().replace(/^"|"$/g, '');

const OrderSchema = new mongoose.Schema({
  id: String,
  customer: String,
  email: String,
  items: Number,
  total: String,
  status: String,
  paymentMethod: String,
  date: String,
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    await Order.deleteMany({});
    
    await Order.insertMany([
      { id: "CR-89412", customer: "Aryan Mehta", email: "aryan@example.com", items: 2, total: "₹5,498", status: "Processing", paymentMethod: "Card", date: "Today, 2:34 PM" },
      { id: "CR-89411", customer: "Priya Sharma", email: "priya@example.com", items: 1, total: "₹1,999", status: "Shipped", paymentMethod: "UPI", date: "Today, 11:02 AM" },
      { id: "CR-89410", customer: "Rohan Kumar", email: "rohan@example.com", items: 3, total: "₹8,497", status: "Delivered", paymentMethod: "COD", date: "Yesterday" },
      { id: "CR-89409", customer: "Anita Singh", email: "anita@example.com", items: 1, total: "₹3,499", status: "Pending", paymentMethod: "Card", date: "Yesterday" },
      { id: "CR-89408", customer: "Dev Patel", email: "dev@example.com", items: 2, total: "₹6,998", status: "Cancelled", paymentMethod: "UPI", date: "2 days ago" },
    ]);
    
    console.log('Orders seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
