angular.module('app', ['ui.router']);


angular.module('app').config(config);

config.$inject = [
    '$stateProvider',
    '$urlRouterProvider'
]

function config($stateProvider, $urlRouterProvider) {

    //states
    var onboardingState = {
        name: 'onboarding',
        url: '/onboarding?uuid&brokerHost&brokerPort&username&password&ssl',
        params: {
            uuid : {
                dynamic: false
            },
            brokerHost: {
                dynamic: false
            },
            brokerPort: {
                dynamic: false
            },
            username: {
                dynamic : false
            },
            password: {
                dynamic : false
            },
            ssl:{
                dynamic : false
            }

        },
        templateUrl: 'scripts/states/onboarding/onboarding.html',
        controller: 'onboardingCtrl',
        controllerAs: 'onboarding',
        resolve: {
            broker: ['$stateParams','brokerDetails', function ($stateParams,brokerDetails) {
            
                if($stateParams.uuid) brokerDetails.UUID = $stateParams.uuid;
                if($stateParams.brokerHost) brokerDetails.HOST = $stateParams.brokerHost;
                if($stateParams.brokerPort) brokerDetails.PORT = $stateParams.brokerPort;
                if($stateParams.username) brokerDetails.USERNAME = $stateParams.username;
                if($stateParams.password) brokerDetails.PASSWORD = $stateParams.password;
                if($stateParams.ssl) brokerDetails.SSL = ($stateParams.ssl.toLowerCase() == 'true');
            }]
        }
    }

    var casualState = {
        name: 'casual',
        url: '/casual',
        templateUrl: 'scripts/states/casual/casual.html',
        controller: 'casualCtrl',
        controllerAs: 'casual',
        params: {
            channel: null,
            ip_address: null
        },
        resolve: {
            parameters: ['$q', '$state','$stateParams', function ($q, $state,$stateParams) {
                var deferred = $q.defer();
               
                if ($stateParams.channel === null) {
                    $state.transitionTo('onboarding', {});
                }else{
                    deferred.resolve();
                }

                return deferred.promise;
            }]
        }
    };

    $stateProvider.state(onboardingState);
    $stateProvider.state(casualState);

    $urlRouterProvider.otherwise('/onboarding');
}

angular.module('app').run(run);
run.$inject = [
]

function run() {
    console.log('Mobile Scalextric by Mobile Scalextric Team 3');
    console.log('Designed by James Sweetland, Sam Lord, Olly Taylor and Nathan Butler');
}
