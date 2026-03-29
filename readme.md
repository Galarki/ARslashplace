# ARslashplace
## Getting started
### Prerequisites
* Node.js
* pnpm
### Installation
1. Clone the repository
```bash
git clone https://github.com/Galarki/ARslashplace.git
cd ARslashplace
```
2. Install client dependencies
```bash
pnpm install
```
3. Install server dependencies
```
cd server
pnpm start
```

### Running the application
1. Starting the vite dev server for the client @root
```bash
pnpm dev
```
2. In a seperate terminal start the websocket server:
```bash 
cd server
pnpm start
```
The websocket server runs on port 3000 by default (configurable via .env in /server)