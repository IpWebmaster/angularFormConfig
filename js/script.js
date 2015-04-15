'user strict';

var registration = angular.module('Registration', ['ngSanitize'])
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

/**
 * Константа с конфигом
 */
registration.constant('configForm', {
    "user" : {
        "last_name" : {
            "validators": {
                "required": true,
                "minLength": 2,
                "maxLength": 40
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения",
                "minLength": "Длина поля <b>Фамилия</b> не должна быть меньше 2 символов",
                "maxLength": "Длина поля <b>Фамилия</b> не должна превышать 40 символов"
            }
        },
        "name": {
            "validators": {
                "required": true,
                "minLength": 2,
                "maxLength": 40
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения",
                "minLength": "Длина поля <b>Имя</b> не должна быть меньше 2 символов",
                "maxLength": "Длина поля <b>Имя</b> не должна превышать 40 символов"
            }
        },
        "middle_name": {
            "validators": {
                "minLength": 2,
                "maxLength": 40
            },
            "errorMsg": {
                "minLength": "Длина поля <b>Отчество</b> не должна быть меньше 2 символов",
                "maxLength": "Длина поля <b>Отчество</b> не должна превышать 40 символов"
            }
        },
        "email": {
            "validators": {
                "required": true,
                "pattern": /[-\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,6}$/
            },
            "errorMsg": {
                "required": "Поле обязательное для заполнения",
                "pattern": "Введенный <b>Email</b> не корректный. Пример: name@sitename.ru."
            }
        },
        "password": {
            "validators": {
                "required": true,
                "minLength": 6,
                "pattern": /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z0-9!@#$%]+$/
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения",
                "minLength": "<b>Пароль</b> должен  быть не менее 6 символов длиной",
                "pattern": "<b>Пароль</b> должен содержать цифры, заглавные и прописные латинские буквы"
            }
        },
        "confirm_password": {
            "validators": {
                "required": true
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения"
            }
        },
        "phone_city": {
            "validators": {
                "required": true,
                "minLength": 1,
                "maxLength": 5,
                "pattern": /[0-9]+$/
            }
        },
        "phone_number": {
            "validators": {
                "required": true,
                "minLength": 5,
                "maxLength": 10,
                "pattern": /^([0-9]|[\-])+$/
            }
        },
        "phone_add": {
            "validators": {
                "minLength": 1,
                "maxLength": 6,
                "pattern": /^[0-9]+$/
            }
        }
    },
    "org": {
        "legal_subject": {
            "disabled": true,
            "validators": {
                "required": true
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения"
            }
        },
        "org_form_id": {
            "disabled": true,
            "validators": {
                "required": true
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения"
            }
        },
        "inn": {
            "disabled": true,
            "validators": {
                "required": true,
                "pattern": /^\d{10}(\d\d){0,1}$/
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения",
                "pattern": "Поле <b>ИНН</b> должно содержать 10 цифр, ИНН ИП - 12"
            }
        },
        "kpp": {
            "disabled": true,
            "validators": {
                "required": true,
                "pattern": /^\d{9}$/
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения",
                "pattern": "Поле <b>КПП</b> должно содержать 9 цифр."
            }
        },
        "is_filial": {
            "disabled": true,
        },
        "full_name": {
            "disabled": true,
            "validators": {
                "required": true,
                "minLength": 3
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения",
                "minLength": "Поле <b>Полное Наименование</b> должно cодержать не менее 3 символов."
            }
        },
        "region": {
            "disabled": true,
            "validators": {
                "required": true
            },
            "errorMsg" : {
                "required": "Поле обязательное для заполнения"
            }
        }
    }
});

registration.controller('registrationForm', ['$scope', function($scope) {
    $scope.dataForm = {
        errors: { email: '' }
    };

    this.showError = function(ngModelCtrl, error) {
        return ngModelCtrl.$error[error];
    }
}]);

registration.directive('validField', ['configForm', function(configForm) {
    return {
        require: 'ngModel',
        restrict: "A",
        scope: {
            property: "=validField",
            onChangeValue: "&"
        },
        compile: function(templateElement, templateAttrs) {
            var ul, property, config, section,
                name = templateAttrs.name;

            property = templateAttrs.validField.substring(1, templateAttrs.validField.length - 1);
            section = angular.lowercase(name.slice(0, name.indexOf("[")));
            config = configForm[section][property];

            if(!angular.isUndefined(config.errorMsg) && angular.isObject(config.errorMsg)) {
                ul = angular.element('<ul/>', {
                    "class": "user-messages",
                    "ng-show": "rc.user_registration.needsAttention(user_registration['"+ templateAttrs.name +"'])"
                });

                templateElement.after(ul);

                angular.forEach(config.validators, function (val, key) {
                    var li = angular.element('<li/>', {
                        "class": "user-messages__message",
                        "ng-show": "reg.showError(user_registration['"+ templateAttrs.name +"'], '" + key + "')",
                        "html": config.errorMsg[key]
                    });

                    ul.append(li);
                });
            }

            /*if(config.disabled) {
                templateElement.prop('disabled', 'disabled');
            }*/

            return {
                pre: function (scope, el, attrs, ngModelCtrl) {
                    var minLength, maxLength, pattern,
                        name      = attrs.name,
                        section   = angular.lowercase(name.slice(0, name.indexOf("["))),
                        config    = configForm[section][scope.property],

                        /**
                         * Валидация по минимальному значению
                         * @param {String} value Значение введенное пользователем
                         * @return {String} Возвращает либо валидное значение, либо undefined
                         */
                        minLengthValidator = function(value) {
                            var validity = ngModelCtrl.$isEmpty(value) || value.length >= minLength;

                            ngModelCtrl.$setValidity('minLength',  validity);
                            return validity ? value : undefined;
                        },

                        /**
                         * Валидация по максимальному значению
                         * @param {String} value Значение введенное пользователем
                         * @return {String} Возвращает либо валидное значение, либо undefined
                         */
                        maxLengthValidator = function(value) {
                            var validity = ngModelCtrl.$isEmpty(value) || value.length <= maxLength;

                            ngModelCtrl.$setValidity('maxLength',  validity);

                            return validity ? value : undefined;
                        },

                        /**
                         * Валидация по обязательности заполнения поля
                         * @param {String} value Значение введенное пользователем
                         * @return {String} Возвращает либо валидное значение, либо undefined
                         */
                        requiredValidator = function(value) {
                            var validity = !ngModelCtrl.$isEmpty(value);

                            ngModelCtrl.$setValidity('required', validity);

                            return validity ? value : undefined;
                        },

                        /**
                         * Валидация по паттерну
                         * @param {String} value Значение введенное пользователем
                         * @return {String} Возвращает либо валидное значение, либо undefined
                         */
                        patternValidator = function(value) {
                            var validity = ngModelCtrl.$isEmpty(value) || pattern.test(value);

                            ngModelCtrl.$setValidity('pattern', validity);

                            return validity ? value : undefined;
                        };

                    if(!angular.isUndefined(config.validators) && angular.isObject(config.validators)) {
                        angular.forEach(config.validators, function (val, key) {
                            switch (key) {
                                case 'required':
                                    requiredValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(requiredValidator);
                                    break;
                                case 'minLength':
                                    minLength = parseInt(config.validators.minLength, 10) || 0;
                                    minLengthValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(minLengthValidator);
                                    break;
                                case 'maxLength':
                                    maxLength = parseInt(config.validators.maxLength, 10) || 100;
                                    maxLengthValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(maxLengthValidator);
                                    break;
                                case 'pattern':
                                    pattern   = config.validators.pattern;
                                    patternValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(patternValidator);
                                    break;
                            }

                        });
                    }
                }
            }
        }
    };
}]);

/**
 * Директива функциональности поля "Организационно Правовая Форма"
 */
registration.directive('legalForm', function() {
    return {
        require: 'ngModel',
        link: function(scope, el, attrs, ngModelCtrl) {
            /*if (!attrs.legalSubject) {
                console.error('legalSubject expects a model as an argument!');
                return;
            }
            scope.$watch(scope.legalSubject, function(value, oldValue) {
                console.log(value);
                console.log(oldValue);
            });*/
        }
    };
});

/**
 * Директива проверки уникальности email
 */
registration.directive('uniqueEmail', ['checkRequest', function(checkRequest) {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
            ngModelCtrl.$parsers.push(function() {
                ngModelCtrl.$setValidity('server', true);

                if (ngModelCtrl.$valid) {
                    var mask = angular.element(element).parent();
                    mask.addClass('js-reg-masked');

                    checkRequest.query({
                        'url': 'check_email/',
                        'data' : {
                            'USER[EMAIL]': ngModelCtrl.$viewValue
                        }
                    }).then(function(json){
                            mask.removeClass('js-reg-masked');
                        }
                        ,function(json){
                            if(json.error.message.length) {
                                ngModelCtrl.$setValidity('server', false);
                                scope.dataForm.errors.email= json.error.message[0];
                                mask.removeClass('js-reg-masked');
                            }
                        });
                }

                return ngModelCtrl.$viewValue;
            });
        }
    };
}]);

/**
 * Директива подтверждение пароля
 */
registration.directive('validateEquals', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ngModelCtrl) {
            if (!attrs.validateEquals) {
                console.error('validateEquals expects a model as an argument!');
                return;
            }

            function validateEqual(value) {
                var validity = (value === scope.$eval(attrs.validateEquals));

                ngModelCtrl.$setValidity('equal', validity);
                return validity ? value: undefined;
            }

            ngModelCtrl.$parsers.push(validateEqual);

            scope.$watch(attrs.validateEquals, function() {
                if(ngModelCtrl.$dirty)
                    ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue);
            });
        }
    };
});

/**
 * Директива для валидации полей при нажатии на кнопку submit
 */
registration.directive('rcSubmit', ['$parse', function($parse) {
    return {
        restrict: 'A',
        require: ['rcSubmit', '?form'],
        controller: ['$scope', function ($scope) {
            this.attempted = false;

            var formController = null;

            this.setAttempted = function() {
                this.attempted = true;
            };

            this.setFormController = function(controller) {
                formController = controller;
            };

            this.needsAttention = function (fieldModelController) {
                if (!formController) return false;

                if (fieldModelController) {
                    return fieldModelController.$invalid && (fieldModelController.$dirty || this.attempted);
                } else {
                    return formController && formController.$invalid && (formController.$dirty || this.attempted);
                }
            };
        }],
        compile: function(cElement, cAttributes, transclude) {
            return {
                pre: function(scope, formElement, attributes, controllers) {

                    var submitController = controllers[0];
                    var formController = (controllers.length > 1) ? controllers[1] : null;

                    submitController.setFormController(formController);

                    scope.rc = scope.rc || {};
                    scope.rc[attributes.name] = submitController;
                },
                post: function(scope, formElement, attributes, controllers) {

                    var submitController = controllers[0];
                    var formController = (controllers.length > 1) ? controllers[1] : null;
                    var fn = $parse(attributes.rcSubmit);

                    formElement.bind('submit', function (event) {

                        submitController.setAttempted();
                        if (!scope.$$phase) scope.$apply();

                        if (!formController.$valid) return false;

                        scope.$apply(function() {
                            fn(scope, {$event:event});
                        });
                    });
                }
            };
        }
    };
}]);

registration.factory('checkRequest', ['$http', function ($http) {
    return {
        query: function(options) {
            return $http.post(window.location.pathname + '' + options.url, options.data);
        }
    };
}]);

angular.element(document).ready(function() {
    angular.bootstrap(document.getElementById('registration__module'),['Registration']);
});