angular.module('app.winState').controller('winCtrl', winCtrl);

winCtrl.$inject = [
    '$rootScope',
    '$state',
    'mqttService',
    'brokerDetails'
];

function winCtrl($rootScope, $state, mqttService, brokerDetails) {
    var vm = this;

    function exit(){
        mqttService.disconnect();
        $state.transitionTo('onboarding', {});
    }
    vm.exit = exit;
}
