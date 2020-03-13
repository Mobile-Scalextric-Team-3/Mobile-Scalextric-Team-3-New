angular.module('app').controller('finishCtrl', finishCtrl);

finishCtrl.$inject = [
    '$scope',
    '$state',
    '$stateParams',
    'stopClock',
    'mqttService',
    'brokerDetails'
];

function finishCtrl($scope, $state, $stateParams, stopClock, mqttService, brokerDetails) {
    var vm = this;

    var channel = $stateParams.channel;
    var bestTime = $stateParams.bestLap;
    var time = $stateParams.time;

    stopClock.endClock();

    time = stopClock.timeFormat(time);
    bestTime = stopClock.timeFormat(bestTime);

    var channelName;

    if(channel == 0){
        channelName = "red"
    }
    else if(channel == 1){
        channelName = "yellow"
    }

    var gameStateTopic = `${brokerDetails.UUID}/control/game_state`;
    mqttService.subscribe(gameStateTopic);

    var div = angular.element(document.querySelector("#finish-message"));
    div.html('Well done ' + channelName + '<br>Your overall time was: ' + time +
    '<br>Your best lap was: ' + bestTime);
    

    function exit(){
        mqttService.disconnect();
        $state.transitionTo('onboarding', {});
    }
    vm.exit = exit;
}
