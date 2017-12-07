"use strict";
angular.module("chatAppV2", ['ui.router','ui.gravatar', 'ngMd5'])
    .config(function($stateProvider,$urlRouterProvider,gravatarServiceProvider) {

        //Set Default Gravater settings
        gravatarServiceProvider.defaults = {
            size     : 100,
            "default": 'mm'  // Mystery man as default for missing avatars
        };

        //Login screen is used as home screen
        $urlRouterProvider.otherwise("/login");

        let states = [
            {
                name: 'login',
                url: '/login',
                template: '<login></login>'
            },
            {
                name: 'users',
                url: '/list/{currentUser}',
                template: '<user-list users="vm.users"></user-list>',
                controllerAs: 'vm'
            },
            {
                name: 'users.chat',
                url: '/{selectedUser}',
                template: '<chat></chat>',
                controllerAs: 'vm'
            }

        ];

        /**
         * Register the states
         */
        states.forEach((state) => {
            $stateProvider.state(state);
        });
    })

    /**
     * Instantiate socket connection
     */
    .factory('socket', function(){
    let socket = io.connect('http://localhost:3000');
    return socket;
    })

    /**
     * Used for loading user into "users" screen when first entering
     * or reloading
      */
    .controller('mainCtrl',(UserService) => {
        UserService.getAllUsers().then((data) => {
                this.users = data;
            });
    });
