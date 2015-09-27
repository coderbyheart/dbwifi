'use strict';

angular.module('dbwifiApp', ['dbwifi'])
    .config(['$interpolateProvider', function ($interpolateProvider) {
        $interpolateProvider.startSymbol('%%');
        $interpolateProvider.endSymbol('%%');
    }])
    .controller('WifiAccountCreatorController', ['$scope', 'MockWifiAccountService', function ($scope, MockWifiAccountService) {
        var vm = this;

        this.submit = function submit() {
            vm.submitting = true;
            vm.importList();
        };

        // This parses the copy&paste data into individual accounts
        // The are expected to be in the format
        // firstname\tlastname\temail\n
        // firstname\tlastname\temail\n
        this.importList = function () {
            var users = [];
            var lines = $scope.listdata.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var personData = lines[i].split('\t');
                var person = {
                    firstname: personData[0],
                    lastname: personData[1],
                    email: personData[2],
                    done: false
                };
                users.push(person);
                (function (user) {
                    MockWifiAccountService
                        .createAccount(person, $scope.senderEmail)
                        .then(function () {
                            user.done = true;
                        });
                })(person);
            }
            vm.users = users; // Render it in the view and launch the actual creation process
        };

    }]);

angular.module('dbwifi', []);

// This is a mock wifi account service for showcasing the process
angular.module('dbwifi').factory('MockWifiAccountService', ['$http', '$q', '$window', function ($http, $q, $window) {
    var WifiAccountService = {};

    // This method calls the 'backend' and creates account
    WifiAccountService.createAccount = function createAccount(person) {
        return $q(function (resolve, reject) {
            // Simulate request
            $window.setTimeout(function () {
                resolve('Created');
            }, Math.random() * 1000);

        });
    };
    return WifiAccountService;
}]);

// This is the real account service
angular.module('dbwifi').factory('WifiAccountService', ['$http', '$q', '$window', '$cookie', function ($http, $q, $window, $cookies) {
    var WifiAccountService = {};

    // This method calls the 'backend' and creates account
    WifiAccountService.createAccount = function createAccount(person, senderEmail) {
        // TODO: think about limiting the number of concurrent requests
        return $q(function (resolve, reject) {
            // This creates the account
            $http({
                method: 'POST',
                url: 'https://wlanguest.noncd.bku-web.db.de:8443/sponsorportal/createKnown.action',
                data: {
                    token: '9JE2JOVBDPQOI754DWNJ5Y7VQHLG5IE1', // TODO: this will be provided by the login page
                    portalSessionId: $cookies.portalSessionId, // Also provided during login
                    firstName: person.firstname,
                    lastName: person.lastName,
                    emailAddress: person.email
                },
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function (response) {
                // This notifies about the created account
                $http({
                    method: 'POST',
                    url: 'https://wlanguest.noncd.bku-web.db.de:8443/sponsorportal/createKnownNotify.action',
                    data: {
                        token: response.data.token, // Response contains token
                        portalSessionId: $cookies.portalSessionId,
                        selected: response.data.id, // The response contains the ID of the created entry
                        email: 'true',
                        copyEmail: senderEmail
                    },
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function () {
                    // There may be more useful actions here, this just marks the entry as "Created" in the table
                    resolve('Created');
                })
            });
        });
    };
    return WifiAccountService;
}]);