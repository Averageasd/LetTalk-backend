require('dotenv').config();
const express = require('express');
const {createServer} = require("http");
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const IOSingleton = require('./socket/IOSingleton');

const httpServer = createServer(app);

const io = IOSingleton.getIOInstance(httpServer);

app.use(cors({
    origin: '*',
}));


app.use(express.json());
app.use(express.urlencoded({extended: true}));

const signup = require('./routes/signup');
const login = require('./routes/login');
const getUser = require('./routes/user');
const chat = require('./routes/chat');

async function main() {
    const uri = process.env.MONGODB_CONNECTION_STRING;
    await mongoose.connect(uri);
}

main().catch((err) => console.log(err));

app.use('/signup', signup);
app.use('/login', login);
app.use('/getUser', getUser);
app.use('/chat', chat);

httpServer.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});