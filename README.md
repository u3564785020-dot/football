# Mexico Static Website

Static website for Mexico World Cup tickets with Express.js server for deployment.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open browser at `http://localhost:3000`

## Deployment to Railway

### Method 1: GitHub Integration (Recommended)

1. Push this repository to GitHub
2. Connect Railway to your GitHub repository
3. Railway will automatically detect `package.json` and deploy
4. The site will be available at your Railway domain

### Method 2: Railway CLI

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize and deploy:
```bash
railway init
railway up
```

## Environment Variables

Railway automatically sets the `PORT` environment variable. No additional configuration needed.

## Files Structure

- `index.html` - Main homepage
- `collections/*.html` - Category pages (French Open, World Cup, etc.)
- `products/*.html` - Product pages
- `server.js` - Express.js server for production
- `package.json` - Node.js dependencies
- `.gitignore` - Git ignore file

## Features

✅ Images working (flagcdn.com)
✅ Footer links redirect to homepage
✅ User account icon removed
✅ GOAL TICKETS logo redirects to homepage
✅ Navigation without dropdown menus

## Support

For issues or questions, contact the development team.

