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
    var theirTime;

    stopClock.endClock();

    var channelName;

    if(channel == 0){
        channelName = "red";
    }
    else if(channel == 1){
        channelName = "yellow";
    }

    var gameStateTopic = `${brokerDetails.UUID}/control/game_state`;
    mqttService.subscribe(gameStateTopic);

    function findWinner(){
        var payload = {
            "time": time,
            "channel": channel            
        }
        mqttService.publish(gameStateTopic, JSON.stringify(payload));
    }
    findWinner();

    function showScore(){
        var div = angular.element(document.querySelector("#finish-message"));
        if(time < theirTime){
            div.html('Well done ' + channelName + '<br>You Won!<br>Your overall time was: ' + stopClock.timeFormat(time) +
        '<br>Your best lap was: ' + stopClock.timeFormat(bestTime));
        }
        else if(theirTime < time){
            div.html('Well done ' + channelName + '<br>You Lost!<br>Your overall time was: ' + stopClock.timeFormat(time) +
        '<br>Your best lap was: ' + stopClock.timeFormat(bestTime));
        }
        else{
            div.html('Well done ' + channelName + '<br>Its a Draw!<br>Your overall time was: ' + stopClock.timeFormat(time) +
        '<br>Your best lap was: ' + stopClock.timeFormat(bestTime));
        }
        
    }

    mqttService.onMessageArrived(function (message) {
        console.log(message);

        if(message.topic === gameStateTopic){
            var gameState = JSON.parse(message.payloadString);
            if(gameState.hasOwnProperty("time")){
                if(gameState.channel != channel){
                    theirTime = gameState.time;
                    showScore();
                }
            }
        }
    });

    function exit(){
        mqttService.disconnect();
        $state.transitionTo('onboarding', {});
    }
    vm.exit = exit;
}
