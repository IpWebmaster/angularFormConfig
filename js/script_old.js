'user strict';

var registration = angular.module('Registration', ['ngSanitize', 'ngMessages'])
    .config(['$provide', '$httpProvider',
        function ($provide, $httpProvider){
            $httpProvider.defaults.headers.post = {'X-Requested-With': 'XMLHttpRequest'};
            $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
            $httpProvider.defaults.transformRequest = function(data) {
                return angular.isObject( data ) && String( data ) !== '[object File]' ? $.param( data ) : data;
            };
            $httpProvider.interceptors.push(['$q', function ($q) {
                return {
                    response: function (response) {
                        if (!response['data'].success) {
                            var reject = (response['data']) ? response['data'] : response['data']['error'];
                            return $q.reject(reject);
                        }
                        return response['data'];
                    },
                    responseError: function (rejection) {
                        return $q.reject(rejection);
                    }
                }
            }]);
        }]);


registration.directive('nxEqual', function() {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, model) {
            if (!attrs.nxEqual) {
                console.error('nxEqual expects a model as an argument!');
                return;
            }
            scope.$watch(attrs.nxEqual, function (value) {
                model.$setValidity('nxEqual', value === model.$viewValue);
            });
            model.$parsers.push(function (value) {
                var isValid = value === scope.$eval(attrs.nxEqual);
                model.$setValidity('nxEqual', isValid);
                return isValid ? value : undefined;
            });
        }
    };
});

registration.directive('select2Init', function () {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            var $orgFormType = $(document.body).find('#legal-form-supplier');
            $element.select2();
            if($attrs.id == 'legal-entity-supplier') {
                $element.on('change', function(){
                    var $this = $(this),
                        value = $this.val();
                    if(value == 'LE'){
                        $orgFormType.find('option[value='+113+']').attr('disabled', 'disabled');
                        $orgFormType.select2('readonly', false);
                        $orgFormType.select2('val', false);
                    }
                    else if(value == 'IB'){
                        $orgFormType.select2('readonly', true);
                        $orgFormType.select2('val', 113);
                    }
                });
            }
        }
    };
});

registration.controller('registrationForm',['$scope','$http',
    function($scope, $http){
        /*Базовый инит данных и настроек*/
        var data = $scope.dataForm = {
            user:{
                is_exist: true,
                email: null
            },
            org:{
                newOrg:false,
                is_accred:false,
                is_bound:false,
                is_filial:false,

                legal_subject:null,
                inn:null,
                kpp:null
            },
            errors: {
                email: '',
                inn_kpp: ''
            },
            required:true
        };


        /**
         * Watch-ер данных модели на измение. Отслеживание заполненности  ИНН и КПП,
         * с последующе проверкой на сервере.
         * */
        $scope.$watch('dataForm', function(value, oldValue){

            if(value.user.email !== oldValue.user.email)
                $scope.user_registration['USER[EMAIL]'].$setValidity('server', true);

            if(value.org.inn !== oldValue.org.inn)
                $scope.user_registration['ORG[INN]'].$setValidity('server', true);

            if(value.org.inn === oldValue.org.inn
                && value.org.kpp === oldValue.org.kpp) return;

            //if(value.org.inn !== oldValue.org.inn
            //    && value.org.kpp === oldValue.org.kpp) data.org.kpp = false;

            $scope.user_registration['ORG[INN]'].$rollbackViewValue();

            if((value.org.inn && value.org.kpp) || (value.org.inn && value.org.legal_subject != 'LE'))
            {
                $scope.checkServer();
            }
        }, true);
        /**
         * Метод для проверки email пользователя на наличие в базе.
         * */
        $scope.checkEmail = function($e){
            if(!data.user.email
                || data.user.email && !data.user.email.length) return;

            var $mask = angular.element($e.target).next();
            $mask.addClass('js-reg-masked');

            var resp = checkRequest({
                'USER[EMAIL]':data.user.email
            }, 'check_email/');

            resp.then(function(json){
                $mask.removeClass('js-reg-masked');
                data.user.is_exist = !json.success;
            }
            ,function(json){
                if(json.error.message.length) {
                    $scope.dataForm.errors.email= json.error.message[0];
                    $scope.user_registration['USER[EMAIL]'].$setValidity('email', true);
                    $scope.user_registration['USER[EMAIL]'].$setValidity('server', false);
                    $scope.user_registration['USER[EMAIL]'].$setPristine();
                    $scope.user_registration['USER[EMAIL]'].$render();
                    $mask.removeClass('js-reg-masked');
                }
            });
        };

        /**
         * Метод для проверки ИНН и КПП на сервере.
         * */
        $scope.checkServer = function(){

        /* Вывод прелоадера */
        var $inn = angular.element('#org__inn').next()
            ,$kpp = angular.element('#org__kpp').next();

        $inn.addClass('js-reg-masked');
        $kpp.addClass('js-reg-masked');
        /* / Вывод прелоадера */

        var post = { 'ORG': { 'INN': data.org.inn } };
        if(data.org.legal_subject == 'LE')
            post.ORG.KPP = data.org.kpp;

        var resp = checkRequest(post, 'check_inn_kpp/');

        resp.then(function(json){
                $inn.removeClass('js-reg-masked');
                $kpp.removeClass('js-reg-masked');
                resetValues();

                //if(is_accred(json)){
                //    data.org.is_bound = json.data.is_bound;
                //    data.required = false;
                //    return;
                //}
                //if(no_accred(json)){
                //    data.org.is_accred = json.data.is_accred;
                //    return;
                //}
                /* Отображем всю форму для регистрации нового пользователя */
                data.org.newOrg = true;
                /* Проверяем все ли поля обязательные, если нет, то выставляем для них required  */
                if(!data.required){
                    data.required = false;
                }
            }
            ,function(json){
                $inn.removeClass('js-reg-masked');
                $kpp.removeClass('js-reg-masked');
                /*Сброс флагов показа сообщений*/
                resetValues();

                if(json.error.message.length){
                    $scope.dataForm.errors.inn_kpp = json.error.message[0];
                    $scope.user_registration['ORG[INN]'].$setValidity('pattern', true);
                 // $scope.user_registration['ORG[INN]'].$setValidity('server', false);
                    $scope.user_registration['ORG[INN]'].$setPristine();
                    $scope.user_registration['ORG[INN]'].$render();
                }
            });
        };

        /**
         * Базовый сброс флагов отвечающих за отображения нотификаций
         * и скрытия части формы для регистрации новых компаний.
         * */
        var resetValues = function(){
            data.org.isSro = false;
            data.org.is_accred = false;
            data.org.is_bound = false;
            data.org.newOrg = false;
            data.required = true;
        };
        /*Смотрим что есть компания с пользоателем и аккедитованная*/
        var is_accred = function(json){
            if(json.data){
                return (!json.data.is_accred && (json.data.is_bound && json.data.is_bound === true));
            }else{
                return (!data.org.is_accred && (data.org.is_bound && data.org.is_bound === true));
            }
        };
        /*Смотрим что компания есть, есть пользователь, но нет аккредитации*/
        var no_accred =  function(json){
            return (json.data.is_accred && json.data.is_accred === true && (json.data.is_bound && json.data.is_bound === true));
        };
        /**
         * Функция обертка для отправки ajax запросов на верификцию даных.
         * */
        var checkRequest = function(data, url){
            return $http.post(window.location.pathname+''+url, data);
        };
}]);

angular.element(document).ready(function() {
    angular.bootstrap(document.getElementById('registration__module'),['Registration']);
});
