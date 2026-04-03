# 🚀 Capstone Project – Local Setup & Demo Guide (SQLite Version)

## ⚠️ IMPORTANT 
This project **does NOT use MySQL Workbench anymore**.

✅ No MySQL  
✅ No MySQL Workbench  
✅ No database installation required  

The database is now a **local file (SQLite)**.

---

First Create a Project folder in file explorer, open it, and in the empty space open the terminal, right click empty space and open terminal.

---

# 🧰 REQUIRED SOFTWARE

##  Install Node.js
Download and install:
https://nodejs.org

After installing, verify in terminal/powershell (file explorer -> project folder -> right click in folders empty space -> click open in terminal):

Type:
node -v
npm -v

Leave the terminal open youll be back (try not to open multiple terminals it gets confusing, if at some point something doesnt work try reloading the terminal)
---


##  Install "DB Browser for SQLite" from the internet using your browser
Download:
https://sqlitebrowser.org/

---

# 📂 STEP 1 — GET THE PROJECT



In the terminal again type:

git init

then

git clone <your-repo-url>

---

# 📦 STEP 2 — INSTALL DEPENDENCIES
In the terminal again type:

npm install

---

# ⚙️ STEP 3 — CREATE .env FILE

In file explorer under your project folder, next to all the rest of the files like server.js and package.json, create a new text editor file, call it .env and paste this is it:

PORT=3000
OAUTH_TOKEN_URL=https://capstoneproject.proxy.beeceptor.com/oauth/token
OAUTH_CLIENT_ID=ksuCapstone
OAUTH_CLIENT_SECRET=P@ymentP@ss!
AUTHORIZE_URL=https://capstoneproject.proxy.beeceptor.com/authorize

---

# ▶️ STEP 4 — START SERVER
In terminal Type:

node server.js

It should say backend listening. If it throws errors then come talk to me or chatgpt.
---

# 🌐 STEP 5 — OPEN APP

In browser type:
http://localhost:3000/login_page1.html

---

# 🗄 DATABASE LOCATION

data/capstone_payments.db

---

# 👀 VIEW DATABASE

Use DB Browser → click "Open Database" → find project folder → choose "data" folder -> capstone_payments.db (remember to refresh the page with the little green arrows after making changes or nothing will show up in the table)

---

# 🧪 DEMO FLOW

1. Run payment  
2. Show result  
3. Open DB  
4. Show inserted row  
5. Run settlement  
6. Show updated row  

---

# 🛠 TROUBLESHOOTING

- npm not working → install Node  
- server not starting → check .env  
- DB missing → run server once  
