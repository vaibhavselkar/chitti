# Chitti Management Application - Deployment Guide

This guide explains how to deploy the Chitti Management Application to Vercel with separate backend and frontend configurations.

## Project Structure for Deployment

```
chitti-management/
├── server/                    # Backend API (Node.js/Express)
│   ├── app.js                # Main application file
│   ├── .env                  # Backend environment variables
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   └── middleware/           # Middleware
├── client/                   # Frontend application (React/Vite)
│   ├── src/                  # React source code
│   ├── .env                  # Frontend environment variables
│   ├── vite.config.ts        # Vite configuration
│   └── package.json
├── uploads/                  # File uploads directory
├── vercel.json              # Vercel deployment configuration
├── .env                     # Root environment variables (development)
└── README.md
```

## Environment Variables

### Backend (.env in server/ directory)
```env
# Backend Environment Variables
NODE_ENV=production
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/chitti

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Nodemailer Configuration (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# WhatsApp API (Free lifetime system)
WHATSAPP_API_ENDPOINT=https://api.free-whatsapp.com
WHATSAPP_API_KEY=your_free_whatsapp_api_key

# SMS (Free SMS service)
SMS_API_ENDPOINT=https://api.free-sms.com
SMS_API_KEY=your_free_sms_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5000000  # 5MB in bytes
UPLOAD_PATH=./uploads
```

### Frontend (.env in client/ directory)
```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:5000
```

## Deployment Steps

### 1. Prepare for Deployment

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Build the frontend:**
   ```bash
   cd client
   npm run build
   ```

3. **Test locally:**
   ```bash
   npm run dev
   ```

### 2. Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel dashboard:**
   - Go to your project settings in Vercel
   - Add all environment variables from both `.env` files
   - Set `NODE_ENV=production`
   - Update `MONGODB_URI` to your MongoDB Atlas connection string

### 3. Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

**Backend Variables:**
- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI=your_mongodb_atlas_connection_string`
- `JWT_SECRET=your_jwt_secret_key`
- `JWT_EXPIRES_IN=7d`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your_email@gmail.com`
- `SMTP_PASS=your_app_password`
- `SMTP_FROM=your_email@gmail.com`
- `WHATSAPP_API_ENDPOINT=https://api.free-whatsapp.com`
- `WHATSAPP_API_KEY=your_whatsapp_api_key`
- `SMS_API_ENDPOINT=https://api.free-sms.com`
- `SMS_API_KEY=your_sms_api_key`
- `FRONTEND_URL=https://your-project.vercel.app`
- `MAX_FILE_SIZE=5000000`
- `UPLOAD_PATH=./uploads`

**Frontend Variables:**
- `VITE_API_URL=https://your-project.vercel.app`

### 4. Database Setup

1. **MongoDB Atlas Setup:**
   - Create a free MongoDB Atlas cluster
   - Get the connection string
   - Update `MONGODB_URI` in Vercel environment variables
   - Add your Vercel IP addresses to the IP Access List

2. **Local MongoDB (Alternative):**
   - Use a local MongoDB instance
   - Ensure it's accessible from your Vercel deployment

### 5. File Uploads

The application uses the `uploads/` directory for storing files. For production:

1. **Vercel Limitations:**
   - Vercel's file system is ephemeral
   - Consider using cloud storage (AWS S3, Google Cloud Storage, etc.)

2. **Alternative Storage Solutions:**
   - Configure cloud storage in your backend
   - Update file upload logic to use cloud storage
   - Update `UPLOAD_PATH` accordingly

### 6. Notifications Setup

1. **WhatsApp Integration:**
   - Set up WhatsApp Business API
   - Update `WHATSAPP_API_ENDPOINT` and `WHATSAPP_API_KEY`

2. **Email Setup:**
   - Configure SMTP settings for your email provider
   - Update SMTP environment variables

3. **SMS Setup:**
   - Set up SMS service provider
   - Update SMS API credentials

## About the Uploads Directory

The `uploads/` directory contains:

- `/uploads/receipts/` - PDF payment receipts
- `/uploads/signatures/` - Member digital signatures
- `/uploads/signatures/.gitkeep` - Placeholder file

**Important Notes:**
- The `.gitkeep` file in `/uploads/signatures/` is used to keep the directory in version control even when it's empty
- For production deployment, consider using cloud storage instead of local file system
- The application handles file uploads through the `/api/members/:id` endpoint

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading:**
   - Ensure all variables are set in Vercel dashboard
   - Check variable names match exactly

2. **Database Connection Issues:**
   - Verify MongoDB Atlas connection string
   - Check IP access list in MongoDB Atlas
   - Ensure database user has proper permissions

3. **File Upload Issues:**
   - Consider implementing cloud storage for production
   - Check file size limits and permissions

4. **CORS Issues:**
   - Ensure `FRONTEND_URL` is correctly set
   - Check CORS configuration in backend

### Health Check

After deployment, test the health endpoint:
```
GET https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Production Considerations

1. **Security:**
   - Use strong JWT secrets
   - Enable HTTPS
   - Implement proper input validation
   - Use environment variables for all secrets

2. **Performance:**
   - Enable gzip compression
   - Optimize images and files
   - Use CDN for static assets

3. **Monitoring:**
   - Set up error tracking
   - Monitor API response times
   - Track database performance

4. **Backups:**
   - Regular database backups
   - Version control for code changes
   - Document configuration changes

## Support

For deployment issues or questions:
- Check the main README.md for additional information
- Review Vercel documentation
- Ensure all dependencies are properly installed