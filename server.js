//Node server.js file
//NOTE: require is importing the module and it is apart of node.
/** Create the Express application**/
let express = require('express');
let app     = express(); //Initalize the app to be a function handler for the HTTP Server

/** Create the Server**/
let server  = require('http').createServer(app); //Import and create a http server
let io      = require('socket.io').listen(server);//Initialize new instance of socket.io by passing the server object.
// This will allow me to listen to the incoming requests
server.listen(process.env.PORT || 3000); // This will return a HTTP.Server object, also the process.env.PORT checks
// to see if the processing environment has a port and if not it will use 3000

let oUsers = {};
console.log("Server running");



//*****************************************START OF SOCKET EVENTS*********************************************//

//Listen on the connection for incoming sockets
io.sockets.on('connection',function (socket) {

    /**
     * Add user event handler
     * Event will check is the username is take.
     * If it is free it will broadcast a new-user event (for notifications)
     * and also call updateUsersList() to all sockets to inform them about a
     * new connection.
     */
    socket.on("add-user",function(sUserName,fn){

        //Check that user doesn't already exist
        if(sUserName in oUsers){
            fn(false);
        }else{
            fn(true);
            socket.username = sUserName;
            oUsers[socket.username] = socket;

            //Emit notification event
            socket.broadcast.emit('new-users',socket.username);

            //Call update function to emit to every node a new user
            updateUserList();
        }
    });

    /**
     * Event handler for UserService call.
     * Used to retrieve all the active users on the server
     */
    socket.on("get-users", function() {
        updateUserList();
    });


    /**
     * Event handler for sending a message to a specific user.
     * The handler will check that both clients are in the same room before
     * emitting a message in the private room
     */
    socket.on("new-message", function(msg){
        let sRecipient = msg.to;
        let sMessage = msg.sMessage;
        let sCurrentUser = msg.from;

        //Check to see if user exists and if they are in the same room
        if(typeof oUsers[sRecipient] !== 'undefined' ) {
            if (oUsers[sRecipient].currentroom === oUsers[sCurrentUser].currentroom) {

                //send message in room
                io.to(oUsers[sCurrentUser].currentroom).emit('received-message', {
                    from: sCurrentUser,
                    to: sRecipient,
                    msg: sMessage
                });

                //Broadcast new message notification
                socket.broadcast.to(oUsers[sCurrentUser].currentroom).emit('new-message', {
                    from: sCurrentUser,
                    to: sRecipient,
                    msg: sMessage
                });
            }
        }
    });

    /**
     * Event handler for when socket connection is disconnected.
     * We remove the user form available users and all listeners
     * associated with the socket connection.
     */
    socket.on("disconnect", function (){
        delete oUsers[socket.username];
        socket.removeAllListeners()
    });


    /**
     * Going to need to ping the selected user for the chat add them in
     */
    socket.on('private-chat',function (data) {

        //Random Room ID
        const sRoomId = Math.floor((Math.random() * 100) + 1);

        //If user is in a chat room, notify the room that they are leaving and add them to the new selected room
        if(typeof oUsers[data.chatParticipent].currentroom !== "undefined"){
           socket.to(oUsers[data.chatParticipent].currentroom).emit('close-room',oUsers[data.chatParticipent].username);
           oUsers[data.chatParticipent].leave(oUsers[data.chatParticipent].currentroom);
        }

        //Add both user to the same room
        oUsers[data.currentUser].currentroom = sRoomId;
        oUsers[data.chatParticipent].currentroom = sRoomId;
        oUsers[data.currentUser].join(sRoomId);
        oUsers[data.chatParticipent].join(sRoomId);

        //Emit the room has been created.
        io.to(sRoomId).emit('room-created', {
            roomID: sRoomId,
            from: data.currentUser,
            to: data.chatParticipent
        });
    });

    /**
     * Handler for when a user in a private closes the chat
     *
     */
    socket.on('leave-room', function (data) {
        //Socket Room
       let sCurrentUserRoom = oUsers[data.sCurrentUser].currentroom; //Current Socket
       let sSelectedUserRoom = oUsers[data.sSelectedUser].currentroom; //Select User

       //Check users are in the same room
       if(sCurrentUserRoom === sSelectedUserRoom){
           socket.to(oUsers[data.sSelectedUser].currentroom).emit('close-room',oUsers[data.sCurrentUser].username);
           oUsers[data.sCurrentUser].leave(sCurrentUserRoom);
           oUsers[data.sSelectedUser].leave(sCurrentUserRoom);
       }
    });


    /**
     * Handler for when the user hit "logout"
     * We emit the event so that other users are notified
     * and remove the user from the list of active users
     */
    socket.on('log-off', function () {
        socket.broadcast.emit('log-off-event',socket.username);
        delete oUsers[socket.username];
        updateUserList();
    });


    /**
     * Handler for when a user is typing.
     * The event is emitted to the client in the room
     */
    socket.on('typing', function (data) {
        socket.to(oUsers[data].currentroom).emit('typing', data);
    });
});

//*****************************************END OF SOCKET EVENTS*********************************************//


/**
 * Common update function to emit to all active sockets.
 */
function updateUserList() {
    io.emit('online-users',Object.keys(oUsers));

}
