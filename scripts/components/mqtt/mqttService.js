angular.module('app').service('mqttService', mqttService);

mqttService.$inject = [
];

function mqttService() {
    var self = this;

    self.initialize = initialize;
    self.connect = connect;
    self.subscribe = subscribe;
    self.publish = publish;
    self.onConnectionLost = onConnectionLost;
    self.onMessageArrived = onMessageArrived;
    self.disconnect = disconnect;

    var client = null;

    // Initialize mqtt client, this must be the done before any other actions
    function initialize(hostname, port, clientId = "") {
        if (!hostname) { throw new Error("Invalid hostname") }
        if (!port) { throw new Error("Invalid port")}
        
        client = new Paho.MQTT.Client(hostname, Number(port), clientId);
    }

    //connect to the mqtt broker
    function connect(callback,options = {}) {
        if (!client) { throw new Error("Need to Initialize Mqtt") }
        if (callback && typeof callback !== 'function') { throw new Error("Callback must be a function")}

    

        options.onSuccess = function(success){
            callback(success,undefined)
        };

        options.onFailure = function(error){
            callback(undefined,error)
        }
       
        client.connect(options);
    }

    //subscribe to a mqtt topic, when message arrives client.onMessageArrived is called
    function subscribe(topic) {
        if (!client) { throw new Error("Need to Initialize Mqtt")}
        if (!topic) { throw new Error("Need to define a topic")}

        client.subscribe(topic)
    }

    //publish mqtt message
    function publish(topic,message){
        if (!client) { throw new Error("Need to Initialize Mqtt")}
        if (!topic) {throw new Error("Need to define a topic")}
        

        var mqtt_message = new Paho.MQTT.Message(message);
        mqtt_message.destinationName = topic;
        client.send(mqtt_message);
    }

    function disconnect(){
        if(client){
            client.disconnect();
        }
        
    }

    //called when connection is lost
    function onConnectionLost(callback) {
        if (!client) { throw new Error("Need to Initialize Mqtt") }
        if (callback && typeof callback !== 'function') { throw new Error("Callback must be a function")}
        
        client.onConnectionLost = callback;
    }

    // called when a message arrives
    function onMessageArrived(callback) {
        if (!client) { throw new Error("Need to Initialize Mqtt") }
        if (callback && typeof callback !== 'function') { throw new Error("Callback must be a function")}

        client.onMessageArrived = callback;
    }

}