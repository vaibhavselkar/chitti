# Chitti Management Web Application

A comprehensive, production-ready web application for managing chit funds (chit schemes). Built with modern technologies and designed for scalability.

## 🚀 Features

### Core System Features

1. **Authentication System**
   - Admin login/register with JWT tokens
   - Password hashing with bcrypt
   - Role-based access control

2. **Chit Group Management**
   - Create and manage chit schemes
   - Configure payout schedules
   - Excel import for payout schedules
   - Track chit status and progress

3. **Member Management**
   - Add members with profile photos and digital signatures
   - Upload documents (Aadhaar, photos)
   - Track member payment status
   - Member dashboard with payment history

4. **Payment Tracking**
   - Record monthly payments
   - Visual payment grid (green/red indicators)
   - Bulk payment recording
   - Payment verification system

5. **Automatic PDF Receipts**
   - Generate detailed payment receipts
   - Include member digital signatures
   - Store and serve PDF files
   - Payment history tables

6. **Notifications System**
   - WhatsApp messaging via Twilio
   - SMS notifications
   - Email receipts
   - Payment reminders

7. **Admin Dashboard**
   - Overview cards (total chits, members, collections)
   - Monthly collection charts
   - Recent activity feed
   - Quick action buttons

8. **Reporting**
   - Member lists export (CSV/PDF)
   - Payment reports
   - Monthly collection summaries
   - Financial summaries

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **pdfkit** - PDF generation
- **Twilio** - WhatsApp/SMS
- **Nodemailer** - Email
- **xlsx** - Excel processing

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **TanStack Table** - Data tables
- **React Hook Form** - Form management
- **Chart.js** - Charts and graphs
- **React Hot Toast** - Notifications

## 📋 Project Structure

```
chitti-management/
├── server/                     # Backend API
│   ├── models/                 # MongoDB schemas
│   │   ├── Admin.js           # Admin model
│   │   ├── ChitGroup.js       # Chit group model
│   │   ├── Member.js          # Member model
│   │   └── Payment.js         # Payment model
│   ├── routes/                # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── chits.js          # Chit management routes
│   │   ├── members.js        # Member management routes
│   │   ├── payments.js       # Payment tracking routes
│   │   └── notifications.js  # Notification routes
│   ├── services/             # Business logic
│   │   ├── pdfService.js     # PDF generation
│   │   └── notificationService.js # Notifications
│   ├── middleware/           # Middleware
│   │   └── auth.js          # Authentication middleware
│   ├── uploads/             # File storage
│   └── app.js              # Main application file
├── client/                  # Frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── App.tsx         # Main app component
│   └── package.json
├── uploads/                # File uploads directory
├── package.json            # Root package.json
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Twilio account (for WhatsApp/SMS)
- SMTP server (for email)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chitti-management
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both frontend (http://localhost:3000) and backend (http://localhost:5000) servers.

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chitti
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Twilio (for WhatsApp/SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# SMTP (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend
VITE_API_URL=http://localhost:5000
```

## 📖 API Documentation

### Authentication

- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Chit Groups

- `POST /api/chits/create` - Create new chit group
- `GET /api/chits` - Get all chit groups
- `GET /api/chits/:id` - Get chit group by ID
- `PUT /api/chits/:id` - Update chit group
- `DELETE /api/chits/:id` - Delete chit group
- `GET /api/chits/:id/dashboard` - Get chit dashboard

### Members

- `POST /api/members/add` - Add new member
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `GET /api/members/:id/payment-status` - Get payment status

### Payments

- `POST /api/payments/record` - Record payment
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `POST /api/payments/bulk-record` - Bulk payment recording

### Notifications

- `POST /api/notifications/sendPaymentReceipt` - Send payment receipt
- `POST /api/notifications/sendBulk` - Send bulk notifications
- `POST /api/notifications/sendPaymentReminder` - Send payment reminders
- `GET /api/notifications/templates` - Get notification templates

## 🎨 UI Features

### Admin Dashboard
- Overview cards showing key metrics
- Monthly collection charts
- Recent activity feed
- Quick action buttons

### Chit Management
- List view of all chit groups
- Individual chit dashboards
- Payment tracking grids
- Member management

### Member Management
- Member list with search and pagination
- Individual member profiles
- Payment history tracking
- Document upload

### Payment Tracking
- Visual payment status grid
- Bulk payment recording
- Payment verification
- PDF receipt generation

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers

## 📊 Database Schema

### Admin
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  isActive: Boolean,
  lastLogin: Date
}
```

### ChitGroup
```javascript
{
  name: String,
  monthlyContribution: Number,
  duration: Number,
  totalMembers: Number,
  payoutSchedule: [{ month: Number, payoutAmount: Number }],
  startDate: Date,
  endDate: Date,
  status: String,
  totalCollected: Number
}
```

### Member
```javascript
{
  name: String,
  phone: String,
  email: String,
  address: String,
  aadhaarNumber: String,
  profilePhoto: String,
  digitalSignatureImage: String,
  chitGroupId: ObjectId,
  withdrawMonth: Number,
  totalPaid: Number,
  isActive: Boolean
}
```

### Payment
```javascript
{
  memberId: ObjectId,
  chitGroupId: ObjectId,
  month: Number,
  amount: Number,
  paymentDate: Date,
  paymentMethod: String,
  receivedBy: String,
  receiptNumber: String,
  isVerified: Boolean
}
```

## 🚀 Deployment

### Backend Deployment

1. **Using Node.js**
   ```bash
   npm install
   npm start
   ```

2. **Using Docker**
   ```bash
   docker build -t chitti-backend .
   docker run -p 5000:5000 chitti-backend
   ```

3. **Using PM2**
   ```bash
   npm install -g pm2
   pm2 start server/app.js --name chitti-backend
   ```

### Frontend Deployment

1. **Build for production**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Deploy to Netlify**
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `client/dist`

### Database Deployment

1. **MongoDB Atlas**
   - Create cluster
   - Update `MONGODB_URI` in environment variables
   - Configure IP access list

2. **Local MongoDB**
   - Install MongoDB locally
   - Start MongoDB service
   - Update connection string

## 🔧 Development

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd client
npm test
```

### Code Formatting
```bash
# Backend
npm run lint

# Frontend
cd client
npm run lint
```

### Development Scripts
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run tests and linting
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by real-world chit fund management needs
- Designed for scalability and maintainability

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@chittimangement.com
- Documentation: [Link to docs]

---

**Note**: This is a production-ready application. Ensure proper security measures when deploying to production environments.