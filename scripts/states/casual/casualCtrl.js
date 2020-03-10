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

    var channel = $stateParams.channel;//sets channel to one sent from previous state

    var sensorChannel = 0;

    vm.showButtons = false;

    var lap = 0;//current lap
    var time = 0, bestTime = 0;//used by the stopclock to check times

    //sets sensor channel
    if(channel == 0){
        sensorChannel = 2;
    }
    else if(channel == 1){
        sensorChannel == 3;
    }

    //getName function retrieves nickname from session data
    function getName() {
        document.getElementById('unique').innerHTML = 
        "Nickname: " + sessionStorage.getItem('nickname');
    }
    
    vm.getName = getName;
    getName();

    //setChannel function sets name of channel and displays it in app
    function setChannel(){
        var channelName;
        var div = angular.element(document.querySelector('#channel'));
        if(channel == 0){
            channelName = "Red"
        }
        else if(channel == 1){
            channelName = "Yellow"
        }
        div.html('Car: ' + channelName);
    }
    vm.setChannel = setChannel;
    setChannel();

    //function controls action box and displays the messages in it
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



    //sets up throttle by defaulting it to 0
    const DEFAULT_THROTTLE = 0;
    vm.throttle = DEFAULT_THROTTLE;
    vm.actualThrottle = DEFAULT_THROTTLE;
    vm.resources = [];

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

    //sets topic details and the subscribes to them
    var throttleTopic = `${brokerDetails.UUID}/control/${channel}/throttle`;
    var getResourcesTopic = `${brokerDetails.UUID}/resources`;
    var resourceStateTopic = `${brokerDetails.UUID}/control/{channel}/{resourceId}/state`;

    var gameStateTopic = `${brokerDetails.UUID}/control/game_state`;
    var lapSensorTopic = `${brokerDetails.UUID}/sensors/${sensorChannel}`;

    mqttService.subscribe(throttleTopic);
    mqttService.subscribe(getResourcesTopic);

    mqttService.subscribe(lapSensorTopic);
    mqttService.subscribe(gameStateTopic);



    //when the 'X' button is pressed
    function stop() {
        resetClock();
        var payload = {
            set : 0
        }
        mqttService.publish(throttleTopic, JSON.stringify(payload));

        mqttService.disconnect();
        $state.transitionTo('onboarding', {});
    }

    //triggered when weapon button clicked
    function fireSpecialWeapon(resourceId) {
        actionUsed(resourceId);//runs actionUsed function to send message to action box
        let payload = {
            "state": "requested",
            "target": vm.targetChannel
        };
        mqttService.publish(resourceStateTopic.replace(/\{resourceId\}/, resourceId).replace(/\{channel\}/, channel), JSON.stringify(payload));
    }



    //function called in onMessageArrive() when lap sensor triggers
    function lapCount(){
        var div = angular.element(document.querySelector('#laps-completed'));
        var div2 = angular.element(document.querySelector('#fastest-lap'));
        lap++;//increments lap by 1

        /*checks lap times to see if a new record has been set or if 
        this is the first lap so set current time as best*/
        if(bestTime == 0){
            bestTime = time;
            div2.html('Fastest Lap: ' + timeFormat(bestTime));
        }
        else if(bestTime != 0 && bestTime > time){
            bestTime = time;
            div2.html('Fastest Lap: ' + timeFormat(bestTime));
        }
        else{
            div2.html('Fastest Lap: ' + timeFormat(bestTime));
        }
        resetClock();
        div.html('Laps completed: ' + lap);
        
    }
    vm.lapCount = lapCount;

    //called every 10 miliseconds by SetInterval() below and increases time by 1 while displaying it
    function stopclock(){
        var div = angular.element(document.querySelector('#current-lap'));     
        time++;
        div.html('Current Lap: ' + timeFormat(time));
    }
    setInterval(stopclock, 10);

    //resets the time varible used by the stopclock to 0;
    function resetClock(){
        time = 0;
    }
    vm.resetClock = resetClock;


    //takes in a number that is 100ths of a second and converts it into a string in minutes, seconds and miliseconds
    function timeFormat(number){
        var miliseconds = 0, seconds = 0, minutes = 0;

        while(number>0){
            if(number>=6000){
                number-=6000;
                minutes++;
            }
            else if(number>=100){
                number-=100;
                seconds++;
            }
            else{
                miliseconds = number;
                number -= miliseconds;
            }
        }

        minutes = (minutes <= 9) ? ("0" + minutes) : minutes;
        seconds = (seconds <= 9) ? ("0" + seconds) : seconds;
        miliseconds = (miliseconds <= 9) ? ("0" + miliseconds) : miliseconds;

        return "" + minutes + ":" + seconds + ":" + miliseconds;
    }
    vm.timeFormat = timeFormat;

    /*-----------------
    Challenge functions
    -------------------*/

    //sends challenge request when button pressed
    function sendChallenge(){
        var div = angular.element(document.querySelector('#action'));
        div.html('Challenge request sent');

        var payload = {
            "request": channel
        }
        mqttService.publish(gameStateTopic, JSON.stringify(payload));
    }
    vm.sendChallenge = sendChallenge;

    //display challenge request
    function receiveChallenge(){
        var div = angular.element(document.querySelector('#action'));
        div.html('Challenge recieved');
        vm.showButtons = true;
        $scope.$apply();//angular refreshes on certain events but must be forced to here by using $scope.$apply()
    }
    vm.receiveChallenge = receiveChallenge;

    //sends accepted race to mqtt
    function acceptRace(){
        var payload = {
            "accepted": true
        }
        mqttService.publish(gameStateTopic, JSON.stringify(payload));
        var div = angular.element(document.querySelector('#action'));
        div.html('Race accepted');
        vm.showButtons = false;
    }
    vm.acceptRace = acceptRace;

    //carries on in casual and displays message saying rejected
    function rejectRace(){        
        var div = angular.element(document.querySelector('#action'));
        div.html('No weapon has been used yet');
        vm.showButtons = false;
    }
    vm.rejectRace = rejectRace;

    //both accepted
    function bothAccept(){
        $state.transitionTo('race',{
            channel: channel,
        });
    }


    /*-----------
    MQTT messages
    -----------*/
    
    //sends mqtt messages to the console
    mqttService.onMessageArrived(function (message) {

        console.log(message);

        if (message.topic === throttleTopic) {
            var throttle  = JSON.parse(message.payloadString);

            //sets actual throttle to what mqtt sever says it is
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
        else if(message.topic === lapSensorTopic){
            lapCount();
        }
        else if(message.topic === gameStateTopic){
            var gameState = JSON.parse(message.payloadString);
            if(gameState.hasOwnProperty("request")){
                if(channel != gameState.request){
                    receiveChallenge();
                }                
            }
            else if(gameState.hasOwnProperty("accepted")){
                if(gameState.accepted){
                    bothAccept();
                }
            }
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
