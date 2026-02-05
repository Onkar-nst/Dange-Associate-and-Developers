# MongoDB Atlas Setup Guide

## 1. Steps to Create MongoDB Atlas Cluster
1. **Sign Up/Login**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an account.
2. **Create Organization & Project**: Set up a new Organization and Project (e.g., "LandDeveloperProject").
3. **Build a Database**: Click on "Build a Database".
4. **Choose Plan**: Select the **M0 Free** tier for development.
5. **Select Region**: Choose a region closest to your server's location (e.g., AWS / Mumbai for India).
6. **Create Cluster**: Click "Create Cluster".

## 2. How to Get Connection String
1. **Database Access**: Under "Security" in the left sidebar, click "Database Access".
   - Click "Add New Database User".
   - Choose "Password" authentication.
   - Set a username and password. **Note down these credentials**.
   - Assign "Read and write to any database" role.
2. **Network Access**: Click "Network Access" in the sidebar.
   - Click "Add IP Address".
   - Select "Allow Access From Anywhere" (0.0.0.0/0) for development, or add your specific IP for production.
3. **Connect**: Go back to the "Database" section.
   - Click the "Connect" button on your cluster.
   - Select "Connect your application".
   - Copy the SRV connection string. It looks like:
     `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`

## 3. Configuration Setup
1. Copy the connection string into your `.env` file for the `MONGO_URI` variable.
2. Replace `<username>` and `<password>` with the credentials you created in step 2.1.
3. Replace `?` with the name of your database (e.g., `land_developer?`).

## 4. Common Mistakes to Avoid
- **Hardcoding Credentials**: Never commit your connection string to GitHub. Always use `.env`.
- **IP Whitelisting**: Forgetting to add `0.0.0.0/0` (or your server's IP) will cause "Connection Timeout" errors.
- **Special Characters in Password**: If your password contains `@`, `:`, or `/`, you must URL-encode it or change it to something simpler.
- **Not Handling Async**: Mongoose connection is asynchronous; ensure you use `async/await` as shown in `config/db.js`.
- **Ignoring Process Exit**: In `config/db.js`, we use `process.exit(1)` if the connection fails. This is crucial in production to let the wrapper (like PM2 or Docker) know the app is down.
