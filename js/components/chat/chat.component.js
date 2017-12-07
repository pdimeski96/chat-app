/**
 * Component controllers sending/received messages
 *
 */

'use strict';
function ChatController($scope,socket,$stateParams,$timeout){
    let vm = this;

    /**
     * Load/Initialise all the local variables
     */
    vm.$onInit =()=>{
        vm.sCurrentUser = $stateParams.currentUser;
        vm.sSelectedUser = $stateParams.selectedUser;
        vm.aMsg = [];
        vm.sStatus = '';
    };

    /**
     * Event listener for received messages
     */
    socket.on("received-message",(data)=>{
        vm.aMsg.push(data);
        $scope.$apply();
    });

    /**
     * OnSend event handler, constructs and sends message to server
     * for processing!
     *
     */
    vm.sendMessage = ()=>{
        let oNewMessage = {
            to:  vm.sSelectedUser,
            from: vm.sCurrentUser,
            sMessage: vm.sNewMessage
        };

        //Emit message to server
        socket.emit("new-message", oNewMessage);

        //Erase the input field of the user when  they press send
        vm.sNewMessage = undefined;
    };


    /**
     * Registers a keyup event and emit's the event to server after 1000
     */
    vm.keyup= () => {
        $timeout.cancel();
        $timeout(function () {
            socket.emit('typing', vm.sCurrentUser);
        },1000);
    };

    /**
     * Registers a keydown event and cancels the timeout event
     */
    vm.keydown= () => {
        $timeout.cancel();
    };

    /**
     * Event listener for "typing" message.
     */
    socket.on('typing', (data) =>{
        vm.sStatus = data + " is typing";
        $scope.$apply();
        $timeout(function () {
            vm.sStatus = '';
        }, 500);
    });

    /**
     * Event handler for closing a chat. Users information
     * is emitted to server.
     */
    vm.leaveRoom = ()=>{
        socket.emit('leave-room',{
            sSelectedUser: vm.sSelectedUser,
            sCurrentUser: vm.sCurrentUser
        });
    }
}

angular.module('chatAppV2')
    .component('chat', {
        templateUrl: 'views/chat/chat.html',
        controller: ChatController,
        controllerAs: 'vm',
        bindings: {
            aMsg: '<',
            sSelectedUser: '@',
            sCurrentUser: '@'
        }
    });
