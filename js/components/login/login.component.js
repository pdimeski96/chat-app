/**
 * Component controller will handle creation of user and navigation
 */

'use strict';

function LoginController($state,socket,$scope) {
    let vm = this;

    /**
     * Load Initial data (random user name)
     */
    vm.$onInit=()=>{
        //This will generate a random 5 value username
        vm.sUserName = Math.random().toString(36).substr(2,5);
    };

    /**
     * Event handler for user creation
     * Add the user to the socket connection but also check that
     * the username is not used.
     * @param sUserName
     */
    vm.createUser =(sUserName) => {
        socket.emit("add-user", sUserName,function(data){
            //If users name is not take navigate to users screen
            if (data) {
                $state.go("users",{currentUser: sUserName});
            } else {
                vm.sErrorLog = "Sorry but your username is taken";
                $scope.$apply();
            }
        });
    };
}

angular.module('chatAppV2')
    .component('login', {
        templateUrl: 'views/login/login.html',
        controller: LoginController,
        controllerAs: 'vm',
        bindings: {
            sErrorLog: "@"}
    });

