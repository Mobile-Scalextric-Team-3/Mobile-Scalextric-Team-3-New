angular.module('app').controller('casualCtrl', casualCtrl);

casualCtrl.$inject = [
    '$scope',
    '$state',
    '$stateParams',
    'mqttService',
    'brokerDetails'
];

function casualCtrl($scope, $state, $stateParams, mqttService, brokerDetails) {
    
    var vm = this;

    var changed = false;

    var channel = $stateParams.channel;//sets channel to one sent from previous state

    
    function getName() {
        document.getElementById('unique').innerHTML = 
        "Nickname: " + sessionStorage.getItem('nickname');
    }
    vm.getName = getName;
    getName();


    //function controls action box
    function actionUsed(resourceId){
        var target = vm.targetChannel;
        var div = angular.element(document.querySelector('#action'));
        if(target == 0){
            target = "red"
        }
        else if(target == 1){
            target = "yellow"
        }
        else if(target == -1){
            target = "no"
        }
        
        if(resourceId == 1){
            div.html('Oil slick used on ' + target + ' car');
        }
        else if(resourceId == 2){
            div.html('Puncture used on ' + target + ' car');
        }
        else if(resourceId == 3){
            div.html('Smart bomb used on ' + target + ' car');
        }        
    }


    vm.actionUsed = actionUsed;


    //Car control starts here
    const DEFAULT_THROTTLE = 0;

    vm.throttle = DEFAULT_THROTTLE;
    vm.actualThrottle = DEFAULT_THROTTLE;
    vm.resources = [];

    /*
    //sets target channels
    vm.targetChannels = Array.apply(null, {
        length: 2
    }).map(Function.call, Number);
    
    //sets list to show all but the channel you are on
    vm.targetChannels = vm.targetChannels.filter(targetChannel => targetChannel !== channel );
    console.log(vm.targetChannels);

    //default target channel -1
    vm.targetChannel = -1;
    */

    //sets target channel as the other channel in race
    if(channel == 0){
        vm.targetChannel = 1;
    }
    else if(channel == 1){
        vm.targetChannel = 0;
    }    

    vm.throttleError = false;

    vm.stop = stop;
    vm.fireSpecialWeapon = fireSpecialWeapon;

    //sets topic details
    var throttleTopic = `${brokerDetails.UUID}/control/${channel}/throttle`;
    var getResourcesTopic = `${brokerDetails.UUID}/resources`;
    var resourceStateTopic = `${brokerDetails.UUID}/control/{channel}/{resourceId}/state`;

    //subscribes to topics
    mqttService.subscribe(throttleTopic);
    mqttService.subscribe(getResourcesTopic);

    //when the 'X' button is pressed
    function stop() {
        var payload = {
            set : 0
        }
        mqttService.publish(throttleTopic, JSON.stringify(payload));
        
        mqttService.disconnect();
        $state.transitionTo('onboarding', {});
    }

    //triggered when weapon button clicked
    function fireSpecialWeapon(resourceId) {
        actionUsed(resourceId);
        let payload = {
            "state": "requested",
            "target": vm.targetChannel
        };
        mqttService.publish(resourceStateTopic.replace(/\{resourceId\}/, resourceId).replace(/\{channel\}/, channel), JSON.stringify(payload));
    }

    //stops when page is closed or changed
    window.onhashchange = function () {
        if (changed) {
            console.log('changed');
            stop();
        } else {
            changed = true;
        }
    }


    
    mqttService.onMessageArrived(function (message) {

        console.log(message);

        if (message.topic === throttleTopic) {
            var throttle  = JSON.parse(message.payloadString);

            if(throttle.hasOwnProperty("throttle")){
                vm.actualThrottle = throttle.throttle;
            }
        } else if (message.topic === getResourcesTopic) {
            vm.resources = JSON.parse(message.payloadString);
            vm.resources.forEach(resource => {
                mqttService.subscribe(resourceStateTopic.replace(/\{resourceId\}/, resource.id));
            });
            $scope.$apply();
        }

        if (vm.resources !== undefined) {
            vm.resources.forEach(resource => {
                if (message.topic === resourceStateTopic.replace(/\{resourceId\}/, resource.id)) {
                    console.log(message);
                }
            })
        }

    });
    

    //watches for throttle change
    $scope.$watch("casual.throttle", function (newThrottle, oldThrottle) {
        if (newThrottle != oldThrottle) {
            var payload = {
                "set": newThrottle
            }
            mqttService.publish(throttleTopic, JSON.stringify(payload));
        }
    })
}
