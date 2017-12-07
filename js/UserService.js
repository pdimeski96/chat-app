/**
 * Service for handling getting clients and displaying
 * notifications.
 */

'use strict';
angular.module('chatAppV2')
    .service('UserService',function(socket,md5) {

        /**
         * Function to fetch the currently active users.
         * Used when screen is refreshed or navigated to for
         * the first time.
         * @returns {Promise.<TResult>}
         */
        this.getAllUsers = ()=> {
            socket.emit("get-users");

            return new Promise((resolve,reject) => {
                socket.on("online-users",(aUsers)=>{
                    if(aUsers.length > 0){
                        resolve(aUsers);
                    }else{
                        reject(false);
                    }
                });
            }).then((aUsers) => {
                return aUsers;
            }, (data) => {
                return data;
            });
        };


        /**
         * Handler for nonfiction's.
         * It will handle display and notifying the user the following actions:
         *  - Log in event
         *  - Log off event
         *  - New message event
         *  - User leave a room
         * @param data: Notification display data
         *
         * NOTE: If the username is an email md5 will hash it and use it
         * to source the gravatar image. If not image is returns default is used
         */
        this.notifyMe = (data) => {
            if (!("Notification" in window)) {
                alert("This browser does not support system notifications");
            }
            else if (Notification.permission === "granted") { //This checks if the browser has accepted notification or not
                notify(data,md5);
            }
            else if (Notification.permission !== 'denied') { //Ask for permission
                Notification.requestPermission((permission)=>{
                    if (permission === "granted") {
                        notify(data,md5);
                    }
                });
            }

            function notify(data,md5) {
                let oNotificationData = {}; //Used to load the alert data
                let sHash = md5(data.user); //User email hash to retrive the photo

                /**
                 * Set the oNotificationData based on what aciton is being carried out
                 */
                if(data.type === 'newUser'){
                    oNotificationData = {
                        title: `${data.user} is online!`,
                        icon:`https://www.gravatar.com/avatar/${sHash}?d=mm`,
                        body: 'A new user has come online',
                    };
                }else if(data.type === 'logoff'){
                    oNotificationData = {
                        title: `${data.user} has logged out!`,
                        icon:`https://www.gravatar.com/avatar/${sHash}?d=mm`,
                        body: 'A user has logged out'
                    };
                }else if(data.type === "newMsg"){
                    oNotificationData = {
                        title:  `new message from ${data.user}`,
                        icon:`https://www.gravatar.com/avatar/${sHash}?d=mm`,
                        body: 'You have a new message!'
                    };
                }else if(data.type === "closeRoom"){
                    oNotificationData = {
                        title:  `${data.user} has left the chat`,
                        icon:`https://www.gravatar.com/avatar/${sHash}?d=mm`,
                        body: 'Chat user has left'
                    };
                }

                /**
                 * This will set the notification data and dispk
                 */
                let notification = new Notification(oNotificationData.title, {
                    icon: oNotificationData.icon,
                    body: oNotificationData.body
                });

                setTimeout(notification.close.bind(notification), 2000);
            }

        };

});