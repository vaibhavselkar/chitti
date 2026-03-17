# Chitti Management System - Simplified Two-File Architecture

This is a simplified version of the Chitti Management System with only two main files: `server/server.js` and `client/client.js`. This architecture makes the system easier to deploy and manage.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

### Configuration

1. **Set up environment variables:**
   Copy the `.env.example` file to `.env` and update with your configuration:
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/chitti
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Twilio (optional, for WhatsApp/SMS)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   
   # SMTP (optional, for email)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # Frontend
   VITE_API_URL=http://localhost:5000
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server:**
   ```bash
   cd client
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser and navigate to:**
   `http://localhost:5173`

### Production Deployment

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Serve the frontend files** using any static file server or copy them to your web server.

3. **Run the backend in production:**
   ```bash
   cd server
   NODE_ENV=production npm start
   ```

## 📁 File Structure

```
chitti-management/
├── server/
│   ├── server.js          # Main backend server file
│   └── package.json       # Backend dependencies and scripts
├── client/
│   ├── client.js          # Main frontend client file
│   └── package.json       # Frontend dependencies and scripts
├── index.html            # HTML entry point for frontend
├── .env                  # Environment variables
└── README.md             # This file
```

## 🔧 Features

### Backend (`server/server.js`)
- **Authentication**: JWT-based login/register system
- **Chit Management**: Create, read, update chit groups
- **Member Management**: Add members with file uploads
- **Payment Tracking**: Record and track payments
- **PDF Generation**: Automatic receipt generation
- **Notifications**: WhatsApp and email notifications
- **File Uploads**: Profile photos and signatures
- **Database**: MongoDB with Mongoose ODM

### Frontend (`client/client.js`)
- **React Components**: Modern React with hooks
- **Routing**: Client-side routing with React Router
- **Authentication**: Login/register forms
- **Dashboard**: Overview of chits, members, and payments
- **CRUD Operations**: Create, read, update operations
- **Responsive Design**: Mobile-friendly interface
- **State Management**: Context API for authentication

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin profile

### Chit Groups
- `POST /api/chits/create` - Create new chit group
- `GET /api/chits` - Get all chit groups
- `GET /api/chits/:id` - Get chit group by ID

### Members
- `POST /api/members/add` - Add new member
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID

### Payments
- `POST /api/payments/record` - Record payment
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID

### Notifications
- `POST /api/notifications/sendPaymentReceipt` - Send payment receipt

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers

## 📊 Database Schema

The application uses MongoDB with the following collections:
- `admins` - Admin user accounts
- `chitgroups` - Chit group information
- `members` - Member information with file uploads
- `payments` - Payment records and receipts

## 🚀 Deployment Options

### Option 1: Local Development
- Run backend on port 5000
- Run frontend on port 5173
- Use local MongoDB instance

### Option 2: Production
- Deploy backend to cloud server (Heroku, AWS, etc.)
- Deploy frontend to static hosting (Netlify, Vercel, etc.)
- Use MongoDB Atlas for cloud database

### Option 3: Docker (Future Enhancement)
- Create Docker containers for backend and frontend
- Use Docker Compose for easy deployment

## 🛠 Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change PORT in .env file
   - Kill existing processes using the port

2. **MongoDB connection errors:**
   - Check MongoDB is running
   - Verify MONGODB_URI in .env

3. **CORS errors:**
   - Ensure frontend and backend URLs are correct in .env
   - Check CORS configuration in server.js

4. **File upload issues:**
   - Check uploads directory exists and has write permissions
   - Verify multer configuration

### Getting Help

- Check the console for error messages
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check MongoDB connection

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This simplified two-file architecture makes the Chitti Management System more accessible for deployment and maintenance while maintaining all core functionality.

---

**Note**: This is a production-ready application. Ensure proper security measures when deploying to production environments.