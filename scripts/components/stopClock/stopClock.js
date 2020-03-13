angular.module('app').service('stopClock', stopClock);

stopClock.$inject = [
    '$interval'
];

function stopClock($interval){

    var self = this;

    self.lapCount = lapCount;
    self.stopclock = stopclock;
    self.timeFormat = timeFormat;
    self.setRaceMode = setRaceMode;
    self.setLap = setLap;
    self.startClock = startClock;
    self.endClock = endClock;

    var promise;

    self.lap = 0;//current lap

    var time = 0, bestTime = 0;//used by the stopclock to check times

    var raceMode = false;

    function lapCount(){
        var div = angular.element(document.querySelector('#laps-completed'));
        var div2 = angular.element(document.querySelector('#fastest-lap'));
        self.lap++;//increments lap by 1

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
        time = 0;

        if(raceMode == true){
            div.html('Lap: ' + self.lap + "/15");
        }
        else{
            div.html('Laps completed: ' + self.lap);
        }
    }

    //called every 10 miliseconds by SetInterval() below and increases time by 1 while displaying it
    function stopclock(){
        var div = angular.element(document.querySelector('#current-lap'));     
        time++;
        div.html('Current Lap: ' + timeFormat(time));
    }

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

    function setRaceMode(boolean){
        raceMode = boolean;
    }

    function setLap(num){
        self.lap = num;
    }

    function startClock(){
        promise = $interval(stopclock, 10);
    }

    function endClock(){        
        $interval.cancel(promise);
        time = 0;
        self.lap = 0;
    }
}