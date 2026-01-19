require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 8000;

// Parse admins array from env
let admins = [];
try {
  admins = JSON.parse(process.env.ADMINS);
} catch (e) {
  console.error("Failed to parse ADMINS env variable:", e);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// Schemas

const customerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  phone: String,
});
const Customer = mongoose.model('Customer', customerSchema);

const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
});
const Service = mongoose.model('Service', serviceSchema);

const appointmentSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }], // changed to array
  date: Date,
  time: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

const emailLogSchema = new mongoose.Schema({
  to: String,
  subject: String,
  body: String,
  sentAt: { type: Date, default: Date.now },
  status: String,
});
const EmailLog = mongoose.model('EmailLog', emailLogSchema);

// Middleware

app.use(cors());
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Nodemailer Setup

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAILUSER,
    pass: process.env.EMAILPASS,
  },
});
transporter.verify(error => {
  if (error) console.error('Nodemailer setup error:', error);
  else console.log('Nodemailer is ready');
});

// Admin Login

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (!(username && password)) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  const admin = admins.find(a => a.user === username && a.pass === password);
  if (admin) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }
});

// Book Appointment

app.post('/api/book', async (req, res) => {
  try {
    const { name, email, phone, services, date, time } = req.body;
    if (!(name && email && phone && services && date && time)) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one service must be selected.' });
    }

    // Find or create customer
    let customer = await Customer.findOne({ email });
    if (!customer) {
      customer = await new Customer({ name, email, phone }).save();
    }

    // Find or create service Ids (resolve all)
    const serviceIds = [];
    for (const serviceName of services) {
      let service = await Service.findOne({ name: serviceName });
      if (!service) {
        service = await new Service({ name: serviceName }).save();
      }
      serviceIds.push(service._id);
    }

    // Save appointment with multiple services
    const appointment = new Appointment({
      customer: customer._id,
      services: serviceIds,
      date: new Date(date),
      time,
      status: 'pending',
    });
    await appointment.save();

    // Prepare services list string for email & log
    const servicesListStr = services.join(', ');

    await new EmailLog({
      to: email,
      subject: 'Appointment Booked',
      body: `Appointment for ${servicesListStr} on ${date} at ${time}`,
      status: 'pending',
    }).save();

    const mailOptions = {
      from: process.env.EMAILUSER,
      to: email,
      subject: 'Salon Appointment Booked',
      html: `<p>Hello ${name}, your appointment for ${servicesListStr} is booked for ${date} at ${time}. Status: Pending.</p>`,
    };

    transporter.sendMail(mailOptions, async (error) => {
      await EmailLog.updateOne(
        { to: email, subject: mailOptions.subject, status: 'pending' },
        { $set: { status: error ? 'fail' : 'success', sentAt: new Date() } }
      );
      if (error) console.error('Email sending error:', error);
    });

    res.json({ success: true, appointmentId: appointment._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get Appointments

app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('customer')
      .populate('services') // populate array
      .sort({ createdAt: -1 });

    const response = appointments.map(a => ({
      id: a._id,
      name: a.customer.name,
      email: a.customer.email,
      phone: a.customer.phone,
      services: a.services.map(s => s.name).join(', '), // join names into string
      date: a.date.toISOString().split('T')[0],
      time: a.time,
      status: a.status,
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Confirm Appointment

app.post('/api/confirm', async (req, res) => {
  try {
    const { id } = req.body;
    const appointment = await Appointment.findById(id).populate('customer').populate('services');
    if (!appointment) return res.status(404).json({ success: false });

    appointment.status = 'confirmed';
    await appointment.save();

    const servicesListStr = appointment.services.map(s => s.name).join(', ');

    const mailOptions = {
      from: process.env.EMAILUSER,
      to: appointment.customer.email,
      subject: 'Appointment Confirmed',
      html: `<p>Dear ${appointment.customer.name}, your appointment for ${servicesListStr} on ${appointment.date.toDateString()} at ${appointment.time} is confirmed.</p>`,
    };

    transporter.sendMail(mailOptions, async (error) => {
      await new EmailLog({
        to: appointment.customer.email,
        subject: mailOptions.subject,
        body: mailOptions.html,
        status: error ? 'fail' : 'success',
      }).save();
      if (error) console.error('Email send error:', error);
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Reject Appointment

app.post('/api/reject', async (req, res) => {
  try {
    const { id } = req.body;
    const appointment = await Appointment.findById(id).populate('customer').populate('services');
    if (!appointment) return res.status(404).json({ success: false });

    appointment.status = 'rejected';
    await appointment.save();

    const servicesListStr = appointment.services.map(s => s.name).join(', ');

    const mailOptions = {
      from: process.env.EMAILUSER,
      to: appointment.customer.email,
      subject: 'Appointment Rejected',
      html: `<p>Dear ${appointment.customer.name}, your appointment for ${servicesListStr} on ${appointment.date.toDateString()} at ${appointment.time} has been rejected.</p>`,
    };

    transporter.sendMail(mailOptions, async (error) => {
      await new EmailLog({
        to: appointment.customer.email,
        subject: mailOptions.subject,
        body: mailOptions.html,
        status: error ? 'fail' : 'success',
      }).save();
      if (error) console.error('Email send error:', error);
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Appointment Count (by status) for admin dashboard

app.get('/api/appointment-counts', async (req, res) => {
  try {
    const pendingCount = await Appointment.countDocuments({ status: 'pending' });
    const confirmedCount = await Appointment.countDocuments({ status: 'confirmed' });
    const rejectedCount = await Appointment.countDocuments({ status: 'rejected' });

    res.json({ pending: pendingCount, confirmed: confirmedCount, rejected: rejectedCount });
  } catch (err) {
    console.error("Count error:", err);
    res.status(500).json({ pending: 0, confirmed: 0, rejected: 0 });
  }
});

// Serve frontend

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
