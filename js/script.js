'user strict';

var has = function (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

var registration = angular.module('Registration', ['ngSanitize'])
    .config(['$provide', '$httpProvider',
        function ($provide, $httpProvider) {
            $httpProvider.defaults.headers.post = {'X-Requested-With': 'XMLHttpRequest'};
            $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
        }]);

registration.controller('registrationForm', ['$scope', function ($scope) {
    $scope.dataForm = {
        errors: {
            email: '',
            inn: '',
            kpp: ''
        }
    };

    this.showError = function (ngModelCtrl, error) {
        return ngModelCtrl.$error[error];
    }
}]);

registration.directive('validField', ['config', 'checkRequest', function (config, checkRequest) {
    return {
        require: 'ngModel',
        restrict: "A",
        compile: function (templateElement, templateAttrs) {
            var ul, configField,
                name = templateAttrs.name;

            configField = config.getConfig(name);

            if (!angular.isUndefined(configField.errorMsg) && angular.isObject(configField.errorMsg)) {
                ul = angular.element('<ul/>', {
                    "class": "user-messages",
                    "ng-show": "rc.user_registration.needsAttention(user_registration['"+ templateAttrs.name +"'])"
                });

                templateElement.after(ul);

                angular.forEach(configField.errorMsg, function (val, key) {
                    var li = angular.element('<li/>', {
                        "class": "user-messages__message js-" + key,
                        "ng-show": "reg.showError(user_registration['"+ templateAttrs.name +"'], '" + key + "')",
                        "html": val
                    });

                    ul.append(li);
                });
            }

            if (configField.disabled) {
                templateElement.prop('disabled', 'disabled');
            }

            return {
                pre: function (scope, element, attrs, ngModelCtrl) {
                    var minLength, maxLength, pattern,
                        name = attrs.name,
                        configField = config.getConfig(name),

                        methods = {
                            /**
                             * Валидация по минимальному значению
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает либо валидное значение, либо undefined
                             */
                            minLengthValidator: function (value) {
                                var validity = ngModelCtrl.$isEmpty(value) || value.length >= minLength;

                                ngModelCtrl.$setValidity('minLength',  validity);

                                return validity ? value : undefined;
                            },

                            /**
                             * Валидация по максимальному значению
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает либо валидное значение, либо undefined
                             */
                            maxLengthValidator: function (value) {
                                var validity = ngModelCtrl.$isEmpty(value) || value.length <= maxLength;

                                ngModelCtrl.$setValidity('maxLength',  validity);

                                return validity ? value : undefined;
                            },

                            /**
                             * Валидация по обязательности заполнения поля
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает либо валидное значение, либо undefined
                             */
                            requiredValidator: function (value) {
                                var validity = !ngModelCtrl.$isEmpty(value);

                                ngModelCtrl.$setValidity('required', validity);

                                return validity ? value : undefined;
                            },

                            /**
                             * Валидация по паттерну
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает либо валидное значение, либо undefined
                             */
                            patternValidator: function (value) {
                                var regexp = new RegExp(pattern);
                                var validity = ngModelCtrl.$isEmpty(value) || regexp.test(value);

                                ngModelCtrl.$setValidity('pattern', validity);

                                return validity ? value : undefined;
                            },

                            /**
                             * Проверка уникальности Email
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает введенное значение для модели
                             */
                            checkUniqueEmail: function (value) {
                                ngModelCtrl.$setValidity('server', true);

                                if (ngModelCtrl.$valid) {
                                    var mask = angular.element(element).parent();
                                    mask.addClass('js-reg-masked');

                                    checkRequest.query({
                                        'method': 'checkUniqueEmail',
                                        'params': {
                                            "USER[EMAIL]": value
                                        }
                                    })
                                        .then(function (data) {
                                            mask.removeClass('js-reg-masked');
                                        }, function (data) {
                                            mask.removeClass('js-reg-masked');
                                            ngModelCtrl.$setValidity('server', false);
                                            scope.dataForm.errors.email = data.message;
                                        });
                                }
                                return value;
                            },

                            /**
                             * Проверка для поля ИНН
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает введенное значение для модели
                             */
                            checkInn: function (value) {
                                ngModelCtrl.$setValidity('server', true);

                                if (ngModelCtrl.$valid) {
                                    var mask = angular.element(element).parent();
                                    mask.addClass('js-reg-masked');

                                    checkRequest.query({
                                        'method': 'checkInn',
                                        'params': {
                                            "ORG[INN]": value
                                        }
                                    })
                                        .then(function (data) {
                                            mask.removeClass('js-reg-masked');
                                        }, function (data) {
                                            mask.removeClass('js-reg-masked');
                                            ngModelCtrl.$setValidity('server', false);
                                            scope.dataForm.errors.inn = data.message;
                                        });
                                }
                                return value;
                            },

                            /**
                             * Проверка длинны ИНН в зависимости от субъекта права
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает введенное значение для модели
                             */
                            checkInnLength: function (value) {
                                var validity,
                                    legalSubject = scope.$eval(attrs.innCustomValid),
                                    pattern = /^\d+$/;

                                if (legalSubject == 'LE') {
                                    validity = ngModelCtrl.$isEmpty(value) || (value.length == 10 && pattern.test(value));

                                    ngModelCtrl.$setValidity('inn_le',  validity);
                                    ngModelCtrl.$setValidity('inn_ib',  true);
                                }

                                if (legalSubject == 'IB') {
                                    validity = ngModelCtrl.$isEmpty(value) || value.length == 12;

                                    ngModelCtrl.$setValidity('inn_ib',  validity);
                                    ngModelCtrl.$setValidity('inn_le',  true);
                                }

                                return value;
                            },

                            /**
                             * Проверка для поля КПП
                             * @param {String} value Значение введенное пользователем
                             * @return {String} Возвращает введенное значение для модели
                             */
                            checkKpp: function (value) {
                                var inn = scope.$eval(attrs.kppCustomValid),
                                    isValidInn = scope.user_registration['ORG[INN]'].$valid;

                                ngModelCtrl.$setValidity('server', true);

                                if (ngModelCtrl.$valid && !angular.isUndefined(inn) && isValidInn ) {
                                    var mask = angular.element(element).parent();
                                    mask.addClass('js-reg-masked');

                                    checkRequest.query({
                                        'method': 'checkInn',
                                        'params': {
                                            "ORG[INN]": inn,
                                            "ORG[KPP]": value
                                        }
                                    })
                                        .then(function (data) {
                                            mask.removeClass('js-reg-masked');
                                        }, function (data) {
                                            mask.removeClass('js-reg-masked');
                                            ngModelCtrl.$setValidity('server', false);
                                            scope.dataForm.errors.kpp = data.message;
                                        });
                                }
                                return value;
                            }
                        };


                    if (!angular.isUndefined(configField.validators) && angular.isObject(configField.validators)) {
                        angular.forEach(configField.validators, function (val, key) {
                            switch (key) {
                                case 'required':
                                    methods.requiredValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(methods.requiredValidator);
                                    break;

                                case 'minLength':
                                    minLength = parseInt(configField.validators.minLength, 10) || 0;
                                    methods.minLengthValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(methods.minLengthValidator);
                                    break;

                                case 'maxLength':
                                    maxLength = parseInt(configField.validators.maxLength, 10) || 100;
                                    methods.maxLengthValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(methods.maxLengthValidator);
                                    break;

                                case 'pattern':
                                    pattern   = configField.validators.pattern;
                                    methods.patternValidator(ngModelCtrl.$viewValue);
                                    ngModelCtrl.$parsers.push(methods.patternValidator);
                                    break;

                                case 'custom':
                                    if (angular.isArray(val)) {
                                        angular.forEach(val, function (name) {
                                            if (has(methods, name)) {
                                                methods[name](ngModelCtrl.$viewValue);
                                                ngModelCtrl.$parsers.push(methods[name]);
                                            }
                                        });
                                    } else {
                                        throw Error("'custom' is not Array");
                                    }
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
 * Директива проверки КПП
 */
registration.directive('kppCustomValid', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
            if (!attrs.kppCustomValid) {
                throw Error('kppCustomValid expects a model as an argument!');
            }

            /* Нужно следить за изменением ИНН, чтобы заного запускать метод проверки КПП */
            scope.$watch(attrs.kppCustomValid, function () {
                if (!angular.isUndefined(ngModelCtrl.$viewValue)) {
                    ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue);
                }
            });
        }
    };
});

/**
 * Директива проверки ИНН в зависимости от субъекта права
 */
registration.directive('innCustomValid', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
            if (!attrs.innCustomValid) {
                throw Error('innCustomValid expects a model as an argument!');
            }

            scope.$watch(attrs.innCustomValid, function (value, oldValue) {
                if (value != oldValue && !angular.isUndefined(ngModelCtrl.$viewValue)) {
                    ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue);
                }
            });
        }
    };
});

/**
 * Директива функциональности поля "Организационно Правовая Форма"
 */
registration.directive('legalCustomForm', function() {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
            if (!attrs.legalCustomForm) {
                throw Error('legalCustomForm expects a model as an argument!');
            }

            scope.$watch(attrs.legalCustomForm, function (value) {
                switch (value) {
                    case 'IB':
                        element.select2('readonly', true);
                        element.select2('val', 113);
                        ngModelCtrl.$setViewValue(113);
                        break;
                    case 'LE':
                        element.select2('readonly', false);
                        element.select2('val', false);
                        ngModelCtrl.$setViewValue("");
                        break;
                }
            });
        }
    };
});

/**
 * Директива для работы с плагином select2
 */
registration.directive('select2Init', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.select2();
        }
    };
});

/**
 * Директива подтверждение пароля
 */
registration.directive('validateEquals', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ngModelCtrl) {
            if (!attrs.validateEquals) {
                throw Error("validateEquals expects a model as an argument!");
            }

            function validateEqual (value) {
                var validity = (value === scope.$eval(attrs.validateEquals));

                ngModelCtrl.$setValidity('equal', validity);

                return validity ? value: undefined;
            }

            ngModelCtrl.$parsers.push(validateEqual);

            scope.$watch(attrs.validateEquals, function () {
                if (ngModelCtrl.$dirty) {
                    ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue);
                }
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

            this.setAttempted = function () {
                this.attempted = true;
            };

            this.setFormController = function (controller) {
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
        compile: function (cElement, cAttributes, transclude) {
            return {
                pre: function (scope, formElement, attributes, controllers) {

                    var submitController = controllers[0];
                    var formController = (controllers.length > 1) ? controllers[1] : null;

                    submitController.setFormController(formController);

                    scope.rc = scope.rc || {};
                    scope.rc[attributes.name] = submitController;
                },
                post: function (scope, formElement, attributes, controllers) {

                    var submitController = controllers[0];
                    var formController = (controllers.length > 1) ? controllers[1] : null;
                    var fn = $parse(attributes.rcSubmit);

                    formElement.bind('submit', function (event) {

                        submitController.setAttempted();
                        if (!scope.$$phase) {
                            scope.$apply();
                        }

                        if (!formController.$valid) {
                            return false;
                        }

                        scope.$apply(function () {
                            fn(scope, {$event:event});
                        });
                    });
                }
            };
        }
    };
}]);

/**
 * Обертка для Ajax запросов по спецификации JSON-RPC 2.0
 */
registration.factory('checkRequest', ['$http', '$q', '$log', function ($http, $q, $log) {
    return {
        query: function (options) {
            var defer = $q.defer();

            $http.post(
                    '/rpc/',
                    JSON.stringify({
                        "jsonrpc": "2.0",
                        "method": options.method,
                        "params": options.params,
                        "id": new Date().getTime()
                    })
                )
                .success(function (data) {
                    if (has(data, "error")) {
                        if (data.error.code > -32000 || data.error.code < -32099) {
                            data.error.message = 'Произошла системная ошибка, свяжитесь с администратором. Код ошибки: ' + data.error.code;
                        }
                        defer.reject(data.error);
                    } else {
                        defer.resolve(data);
                    }
                })
                .error(function (msg, code) {
                    $log.error(msg, code);
                });

            return defer.promise;
        }
    };
}]);

/**
 * Получение конфигурационного файла поля формы
 */
registration.factory('config', function () {
    if (!has(window.templateData, "validator")) {
        throw Error("Object 'templateData' is missing property 'validator'");
    }

    var configForm = window.templateData.validator;

    return {
        /**
         * Возвращает конфиг поля формы
         * @param {String} name Имя поля формы
         * @return {Object} Объект с конфигом
         */
        getConfig: function (name) {
            if (angular.isUndefined(name) || !angular.isString(name)) {
                throw Error("Not specified 'name' from the form fields");
            }

            this.name = name;

            if (this.name.indexOf("[") == -1) {
                return configForm[angular.lowercase(this.name)];
            } else {
                return this.getConfigField(this.getProperties(), configForm);
            }

        },

        /**
         * Парсинг строки имени поля в форме
         * @return {Array} Массив свойст
         */
        getProperties: function () {
            var arrProperty = [], resultArr = [];

            arrProperty = this.name.split('[');

            resultArr = arrProperty.map(function(prop, index) {
                if (index > 0) {
                    prop = prop.slice(0, -1);
                }
                return angular.lowercase(prop);
            });

            return resultArr;
        },

        /**
         * Получение конфига формы на основе массива свойств
         * @param {Array} arrProp Массив свойств
         * @param {Object} config Имя поля формы
         * @return {Object} Конфиг поле формы
         */
        getConfigField: function (arrProp, config) {
            for (var i = 0; i < arrProp.length; i++ ) {
                if (has(config, arrProp[i])) {
                    config = config[arrProp[i]];
                }
            }

            return config;
        }
    };
});



angular.element(document).ready(function() {
    angular.bootstrap(document.getElementById('registration__module'),['Registration']);
});