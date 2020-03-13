angular.module('app').controller('raceCtrl', raceCtrl);

raceCtrl.$inject = [
    '$scope',
    '$state',
    '$stateParams',
    'stopClock',
    'mqttService',
    'brokerDetails'
];

function raceCtrl($scope, $state, $stateParams, stopClock, mqttService, brokerDetails){

    var vm = this;

    var channel = $stateParams.channel;//sets channel to one sent from previous state

    var sensorChannel = 0;

    var car0Ready = false, car1Ready = false;   

    stopClock.setRaceMode(true);
    console.log(stopClock.raceMode);

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

    /*---------
    MQTT Topics
    ----------*/

    //sets topic details and the subscribes to them
    var throttleTopic = `${brokerDetails.UUID}/control/${channel}/throttle`;
    var getResourcesTopic = `${brokerDetails.UUID}/resources`;
    var resourceStateTopic = `${brokerDetails.UUID}/control/{channel}/{resourceId}/state`;

    var lapSensorTopic = `${brokerDetails.UUID}/sensors/${sensorChannel}`;
    var gameStateTopic = `${brokerDetails.UUID}/control/game_state`;

    mqttService.subscribe(throttleTopic);
    mqttService.subscribe(getResourcesTopic);

    mqttService.subscribe(lapSensorTopic);
    mqttService.subscribe(gameStateTopic);


    //when the 'X' button is pressed
    function stop() {
        var payload = {
            set : 0
        }
        mqttService.publish(throttleTopic, JSON.stringify(payload));

        stopClock.endClock();

        mqttService.disconnect();
        $state.transitionTo('onboarding', {});
    }

    /*------------
    Race functions
    ------------*/

    //sets up the race
    function setupRace(){
        stopClock.setLap(0);
        var div = angular.element(document.querySelector('#action'));
        div.html('Driving to the starting line, please wait...');
        var payload = {
            "set": 40
        }
        mqttService.publish(throttleTopic, JSON.stringify(payload));        
    }
    setupRace();

    //when cars are ready countdown begins
    function ready(){
        var payload = {
            "set": 0
        }
        mqttService.publish(throttleTopic, JSON.stringify(payload));
    }

    //starts the race
    function start(){
        var div = angular.element(document.querySelector('#action'));
        div.html('Race starts');        
        stopClock.startClock();
        stopClock.setLap(1);

    }

    //finish the race
    function finish(){
        var div = angular.element(document.querySelector('#action'));
        div.html('Race over'); 
        stopClock.endClock();
        $state.transitionTo('finish',{
            channel: channel,
        });
    }

    //triggered when weapon button clicked
    function fireSpecialWeapon(resourceId) {

        var resourceId = resourceId1;

        let payload = {
            "state": "requested",
            "target": vm.targetChannel
        };
        mqttService.publish(resourceStateTopic.replace(/\{resourceId\}/, resourceId).replace(/\{channel\}/, channel), JSON.stringify(payload));
        actionUsed(resourceId);
    }
    
    function carCtrl() {
        
        var vm = angular.extend(this, {});
        
        function weaponBox() {

            buttonEnable();

            var myArray = [
            "Smart Bomb",
            "Oil Slick",
            "Puncture"
            ];
        
            var randomWeapon = myArray[Math.floor(Math.random()*myArray.length)]; 
            
            vm.randomWeapon = randomWeapon

            var resourceId;

            if(randomWeapon == "Oil Slick") {
                resourceId = 1
            }
            else if (randomWeapon == "Puncture") {
                resourceId = 2
            }
            else if (randomWeapon == "Smart Bomb") {
                resourceId = 3
            }

            var div = angular.element(document.querySelector('#weapon-select'));
            div.html(randomWeapon);

            resourceId1 = resourceId;

        }
        vm.weaponBox = weaponBox;

        function buttonEnable() {
            document.getElementById("weapon-select").disabled = false;
        }
        vm.buttonDisable = buttonEnable;

        function buttonDisable() {
            document.getElementById("weapon-select").disabled = true;
        }
        vm.buttonDisable = buttonDisable;

        setInterval(weaponBox, 5000);
        
        return vm;

    }

    carCtrl();

    /*-----------
    MQTT services
    ------------*/
    
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
            if(stopClock.lap == 0){
                var payload = {
                    "ready": channel
                }
                mqttService.publish(gameStateTopic, JSON.stringify(payload));
            }
            else if(stopClock.lap == 15){
                finish();
            }
            else{
                stopClock.lapCount();
            }        

        }
        else if(message.topic === gameStateTopic){
            var gameState = JSON.parse(message.payloadString);
            if(gameState.hasOwnProperty("ready")){
                if(gameState.ready == channel){
                    ready();
                }

                if(gameState.ready == 0){
                    car0Ready = true;
                }
                else if(gameState.ready == 1){
                    car1Ready = true;
                }

                if(car0Ready && car1Ready){
                    var payload = {
                        "begin": true
                    }
                    mqttService.publish(gameStateTopic, JSON.stringify(payload));
                }
            }
            else if(gameState.hasOwnProperty("begin")){
                start();
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
    $scope.$watch("race.throttle", function (newThrottle, oldThrottle) {
        if (newThrottle != oldThrottle) {
            var payload = {
                "set": newThrottle
            }
            mqttService.publish(throttleTopic, JSON.stringify(payload));
        }
    })
}