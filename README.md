# 💈 MEN'S Salon – Appointment Booking System

A full-stack **Men’s Salon Appointment Booking Web Application** that allows customers to book salon services online and enables admins to manage appointments efficiently with real-time updates and email notifications.

---

## 🌟 Live Features Overview

### 👨‍💼 Customer Side
- View salon services with pricing
- Select **multiple services**
- Choose preferred **date & time**
- Book appointments online
- Form validation for name, email, phone, date & time
- Instant booking confirmation message

### 🔐 Admin Side
- Secure admin login
- View all appointments in one dashboard
- Confirm or reject bookings
- Appointment status updates (Pending / Confirmed / Rejected)
- Automatic email notifications to customers

---

## 🛠 Tech Stack

| Layer | Technologies |
|-----|-------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Email | Nodemailer (Gmail SMTP) |
| Auth | Session-based Admin Login |

---

## 📂 Project Structure

📦 mens-salon-app
┣ 📜 index.html # Customer booking UI
┣ 📜 admin.html # Admin login & dashboard
┣ 📜 styles.css # Complete UI styling
┣ 📜 script.js # Booking logic & validation
┣ 📜 admin.js # Admin panel logic
┣ 📜 server.js # Backend server & APIs
┣ 📜 .env # Environment variables
┣ 📜 package.json
┗ 📜 README.md


---
⚙️ Installation & Setup


1️⃣ Navigate to Project Folder
cd mens-salon-app

2️⃣ Install Dependencies
npm install

3️⃣ Create .env File

Create a .env file in the root directory and add the following:

MONGO_URI=mongodb://127.0.0.1:27017

EMAILUSER=your_email@gmail.com
EMAILPASS=your_app_password

ADMINS=[
  {"user":"varun","pass":"varun"},
  {"user":"arjun","pass":"arjun"},
  {"user":"vijay","pass":"vijay"}
]


⚠️ Important:
Use a Gmail App Password, not your main Gmail password.

4️⃣ Start MongoDB
mongod


✅ MongoDB should show “MongoDB started successfully”

5️⃣ Run the Server
node server.js


🚀 Server will run on:

http://localhost:8000

🔑 Admin Login Details (Demo)
Username	Password
varun	varun
arjun	arjun
vijay	vijay

🔗 Admin Panel URL:

http://localhost:8000/admin.html

🔁 Application Flow

User selects services

User chooses date and time

Appointment is saved in MongoDB

Status defaults to Pending

Admin confirms or rejects booking

Customer receives email notification

Admin dashboard updates in real time

📧 Email Notifications

Emails are automatically sent when:

Appointment is booked

Appointment is confirmed

Appointment is rejected

📨 Powered by Nodemailer + Gmail SMTP

🚀 Future Enhancements

Payment gateway integration

Slot availability management

SMS notifications

Admin analytics dashboard

Role-based authentication

👨‍💻 Author

Varun J
Full Stack Developer | Web Enthusiast

📌 Built as a real-world full-stack project to demonstrate end-to-end development skills.

⭐ Support

If you like this project:

Give it a ⭐ on GitHub

Fork it 🍴

Improve it 🚀

Happy Coding! 💻✨










