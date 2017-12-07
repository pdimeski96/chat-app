/**
 * Main component that handles updates and also event for its child component (chat)
 */

'use strict';

function UserController(UserService, socket, $scope, $stateParams, $state) {
    let vm = this;

    /**
     * Load all the active users and set any variables
     */
    vm.$onInit=()=>{
        vm.sCurrentUser = $stateParams.currentUser;

        UserService.getAllUsers().then((data) => { //Need this in case of refresh so we can re-load the active users
           if(!data){
               vm.sErrMsg = "No users Active"
           }else {
               vm.aUsers = data;
               $scope.$apply();
               if(!(vm.aUsers.includes(vm.sCurrentUser))){
                   $state.go("login");

               }
           }
        });
    };

    /**
     * onClick handler for logging out user.
     * Emit event to server.
     */
    vm.removeUser =()=>{
        socket.emit('log-off');
    };


    /*******************************START EVENT LISTENERS**************************************/
    /**
     * Event listeners for online users. Client will be notified by server
     * when a new client is online. Data is then forwarded to UserService for
     * nonfiction activation.
     */

    socket.on("online-users",(data) => { //New User event for updating list
        if(data.length > 0){
            vm.aUsers = data;
            $scope.$apply();
        }
    });

    socket.on('new-users',(data)=>{ //New user notification event
        UserService.notifyMe({
            type: 'newUser',
            user: data
        });
    });

    socket.on('log-off-event',(data)=>{ //User logoff notification event
        UserService.notifyMe({
            type: 'logoff',
            user: data
        });
    });

    socket.on('new-message',(data)=>{ //New message notification event
        UserService.notifyMe({
            type: 'newMsg',
            user: data.from
        });
    });

    socket.on("close-room", (data)=>{ //Closed room notification event
        UserService.notifyMe({
            type: 'closeRoom',
            user: data
        });
        $state.go("users",{currentUser: vm.sCurrentUser});
    });


    socket.on('room-created', (data) => { //Chat created notification event
        //Check if user is making a room with their self
        if (vm.sCurrentUser === data.to) {
            data.to = data.from;
        }
        $state.go("users.chat", {selectedUser: data.to});
    });



    /*******************************END EVENT LISTENERS**************************************/


    /**
     * OnClick handler when user selects another user.
     * Event will initiate a chat room and send the user name to the server
     * for creation
     * @param user: Selected username
     */
    vm.createChat =(user)=>{
        socket.emit('private-chat', {
            chatParticipent: user,
            currentUser: vm.sCurrentUser
        });
    };
}

angular.module('chatAppV2')
    .component('userList', {
        templateUrl: 'views/userList/user-list.html',
        controller: UserController,
        controllerAs: 'vm',
        bindings: {
            aUsers  : '<'
        },
    });

