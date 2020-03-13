angular.module('app').controller('finishCtrl', finishCtrl);

finishCtrl.$inject = [
    '$rootScope',
    '$state',
    'mqttService',
    'brokerDetails'
];

function finishCtrl($rootScope, $state, mqttService, brokerDetails) {
    var vm = this;

    function exit(){
        mqttService.disconnect();
        $state.transitionTo('onboarding', {});
    }
    vm.exit = exit;
}
