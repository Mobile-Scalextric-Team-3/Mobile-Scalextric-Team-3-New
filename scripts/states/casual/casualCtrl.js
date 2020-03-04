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

    var changed = false;//variable for checking if user has changed to another webpage

    var channel = $stateParams.channel;//sets channel to one sent from previous state

    var sensorChannel = 0;

    var lap = 0;

    var mili = 0;
    var secs = 0;
    var mins = 0;

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

    var lapSensorTopic = `${brokerDetails.UUID}/sensors/${sensorChannel}`;

    mqttService.subscribe(throttleTopic);
    mqttService.subscribe(getResourcesTopic);

    mqttService.subscribe(lapSensorTopic);

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
        actionUsed(resourceId);//runs actionUsed function to send message to action box
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

        if (vm.resources !== undefined) {
            vm.resources.forEach(resource => {
                if (message.topic === resourceStateTopic.replace(/\{resourceId\}/, resource.id)) {
                    console.log(message);
                }
            })
        }

    });

    function raceCtrl() {
        
        var vm = angular.extend(this, {});
        
        function weaponBox() {
    
            var myArray = [
            "Smart Bomb",
            "Oil Slick",
            "Puncture"
            ];
        
            var randomWeapon = myArray[Math.floor(Math.random()*myArray.length)]; 

            
            document.getElementById('weapon').innerHTML = randomWeapon;
        
        }

    function lapCount(){
        var div = angular.element(document.querySelector('#laps-completed'));
        lap++;
        div.html('Lap: ' + lap);
    }
    vm.lapCount = lapCount;

    function stopclock(){
        var div = angular.element(document.querySelector('#current-lap'));
        var mili0;
        var secs0;
        var mins0;
        mili++;
        if(mili >= 99){
            secs++;
            mili=0;
        }
        if(secs >= 59){
            mins++;
            secs=0;
        }

        if(mili < 10){
            mili0 = "0" + mili;
        }
        else{
            mili0 = mili;
        }

        if(secs < 10){
            secs0 = "0" + secs;
        }
        else{
            secs0 = secs
        }

        if(mins < 10){
            mins0 = "0" + mins;
        }
        else{
            mins0 = mins;
        }
        div.html('Current Lap: '+ mins0 + ":"+ secs0 + ":" + mili0);
    }
    setInterval(stopclock, 10);
    
        setInterval(weaponBox, 3000)
    
        return vm;
    
    }
    raceCtrl();

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
