angular.module('app').controller('onboardingCtrl', onboardingCtrl);

onboardingCtrl.$inject = [
    '$rootScope',
    '$state',
    'mqttService',
    'brokerDetails'
];

function onboardingCtrl($rootScope, $state, mqttService, brokerDetails) {
    var vm = this;

    vm.channels = {
        Red: 0,
        Yellow: 1
    }
    vm.channel = 0;


    console.log(brokerDetails);

    vm.go = go;
    vm.nickname = nickname;

    function go(valid) {
        if (!valid) {
            alert("Invalid Details")
        } else {
            nickname();
            mqttService.initialize(brokerDetails.HOST, brokerDetails.PORT);
            mqttService.onConnectionLost(function () {
                console.error("connection lost");
            });


            var mqttOptions = {};

            if (brokerDetails.SSL) { mqttOptions.useSSL = brokerDetails.SSL; }
            if (brokerDetails.USERNAME) {
                mqttOptions.userName = brokerDetails.USERNAME;
                if(brokerDetails.PASSWORD){
                    mqttOptions.password = brokerDetails.PASSWORD;
                }
            }

            

            mqttService.connect(function (success, error) {
                if (success) {
                    $state.transitionTo('casual',
                        {
                            channel: vm.channel,
                        });
                } else if (error) {
                    console.log(error)
                    alert(`Could Not Connect to ${brokerDetails.HOST}:${brokerDetails.PORT}`)
                }

            },mqttOptions)
        }

    }
}

function nickname() {
    var name = document.getElementById("name").value;
    sessionStorage.setItem("nickname", name);
}