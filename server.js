const path = require('path');
const express = require('express');
const http = require('http')
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages'); 
const {userJoin, getCurrentUser,userLeave,
    getRoomUsers} = require('./utils/users');


//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatChord Bot';
//Run when client conects
io.on('connection', socket=>{
    socket.on('joinRoom',({username, room})=>{
        const user = userJoin(socket.id,username,room);
        socket.join(user.room);
        //Welcome current user
    socket.emit('message', formatMessage(botName,'Welcome to ChatChord'));

    //Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message' ,  formatMessage(botName,`${user.username} has joined the chat`));

    //send user and room info
    io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
    });

    
    });
    
    
    //listen for chatMessage
    socket.on('chatMessage', (msg) =>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    }); 

    //Runs when a client disconnects
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
        }
        //send user and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        });
        
    });
    
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));