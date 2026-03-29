# ARslashplace
## Why is this project?
This project originated from an idea (and an assignment) I recieved in a class Web Topics.
In this class we recieved the task to create something from different web technologies and open source libraries.
Some of these were:
  - Three.js
  - Websockets
  - WebXR
  - OpenLayers
  - RSS
  - WebMentions
  - PWA & Workers
## What is this project?
This project consists of a combination of different web technologies (listed above).  
It's a PWA where the user gets transported to a digital 3D realm that at first sight is nothing more than a computer screen.
But what the user will soon discover, is that this is a lot more real than first thought.
With the coming of age of webXR applications this 3D realm has gained the ability to be transformed into an overlay and be discovered in the real world!
## How is this project?
It utilizes Three.js as a 3D rendering engine with a custom written voxel engine & renderer.  
Websockets form the connection between client server client, where users connect to the server and see each others avatar and interactions in realtime.  
A minimap is created with OpenLayers which'll show a top down view of placed voxels (Not implemented).  
There lives a RSS endpoint where changelogs get posted to.  
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
cd client
pnpm install
cd ..
```
3. Install server dependencies
```bash
cd server
pnpm install
cd ..
```
### Running the application
1. Starting the vite dev server for the client
```bash
cd client
pnpm dev
```
2. In a seperate terminal start the websocket server
```bash 
cd server
pnpm start
```
The websocket server runs on port 3000 by default (configurable via .env in /server)
