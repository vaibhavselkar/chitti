# Chitti Management SaaS

A production-ready multi-tenant Chitti Management System built with React, Node.js, and MongoDB.

## 🚀 Features

### Core Features
- **Multi-tenant Architecture**: Each admin sees only their own data
- **Secure Authentication**: JWT with HTTP-only cookies
- **Google OAuth**: Optional Google login integration
- **Responsive Design**: Works on desktop, tablet, and mobile

### Management Features
- **Chitti Groups**: Create and manage multiple Chitti groups
- **Member Management**: Add, track, and manage members
- **Payment Tracking**: Record and track all payments
- **Withdrawal System**: Handle member withdrawals
- **PDF Reports**: Generate professional PDF reports
- **WhatsApp Notifications**: Send automated payment reminders
- **Real-time Notifications**: Track all system activities

## 🛠 Tech Stack

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** for form handling
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Security
- **Multi-tenant isolation**: Every query filtered by adminId
- **HTTP-only cookies**: Secure token storage
- **Input sanitization**: Prevent SQL injection and XSS
- **Rate limiting**: Protect against brute force attacks
- **CORS**: Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chitti-management-saas
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/chitti_manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### Database Setup

1. **Local MongoDB**
   ```bash
   # Start MongoDB locally
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 mongo:latest
   ```

2. **MongoDB Atlas (Cloud)**
   - Create cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Update `MONGO_URI` in `.env`

## 🏗 Project Structure

```
chitti-management-saas/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── services/      # API service functions
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   └── utils/         # Utility functions
│   └── package.json
├── .env.example           # Environment variables template
└── README.md
```

## 🚀 Pages & Features

### 1. Landing Page
- Modern, responsive landing page
- Feature highlights
- Call-to-action buttons

### 2. Authentication System
- Google OAuth integration
- Email/password authentication
- JWT tokens with HTTP-only cookies
- Protected routes

### 3. Dashboard
- Overview of all Chitti groups
- Key metrics and statistics
- Recent activity summary
- Quick actions

### 4. Chitti Groups Management
- Create new Chitti groups
- View group details
- Track group status (Open/Full)
- Member management

### 5. Members Management
- Add new members
- View member list
- Search and filter
- Member details

### 6. Payment System
- Record payments
- Track payment status
- Visual payment matrix
- Payment history

### 7. Withdrawal System
- Handle member withdrawals
- Track withdrawal details
- Calculate received amounts

### 8. PDF Generation
- Generate member reports
- Professional PDF format
- Payment history included

### 9. WhatsApp Integration
- Automated payment reminders
- PDF report sharing
- Member notifications

### 10. Notifications
- Real-time activity tracking
- Payment notifications
- System alerts

### 11. Reports
- Monthly collection reports
- Pending payment summaries
- Export functionality

### 12. Settings
- Profile management
- Phone number updates
- Signature upload

## 🔐 Security Features

### Multi-tenant Isolation
Every database query includes `adminId` filter:
```javascript
// Example: Always filter by adminId
const groups = await ChittiGroup.find({ adminId: req.user.id })
```

### Authentication Middleware
Protected routes require valid JWT tokens:
```javascript
// Example: Protected route
router.get('/groups', authMiddleware, getGroups)
```

### Input Validation
All inputs are validated and sanitized:
```javascript
// Example: Validation middleware
body('name').trim().isLength({ min: 2 })
```

## 📊 Database Models

### User Model
- name, email, password, phoneNumber
- Google OAuth support
- Email verification

### ChittiGroup Model
- name, totalMembers, monthlyAmount
- totalMonths, collectionDay, startDate
- status (OPEN/FULL), adminId

### Member Model
- name, phoneNumber, adminId
- unique phone number per admin

### Payment Model
- memberId, groupId, monthNumber
- amountPaid, paidDate, status
- adminId for isolation

### Withdrawal Model
- memberId, monthNumber, amountReceived
- discount, adminId

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client && npm run build

# Start backend
cd server && npm start
```

### Docker (Optional)
```bash
# Build and run with Docker
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@chittimanager.com

## 🔗 Links

- [Live Demo](https://chitti-manager.vercel.app)
- [Documentation](https://docs.chittimanager.com)
- [API Reference](https://api.chittimanager.com/docs)

---

**Note**: This is a production-ready system with comprehensive security measures. Always use strong passwords and keep your environment variables secure.