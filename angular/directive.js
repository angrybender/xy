/**
 * use:
 * <nav paginator data-per-page="perPage" data-total="packages.total" data-current="current"  data-base-url="paginatorBaseUrl"></nav>
 */

angular.module('crm.common.directives.paginator', []).
    directive('paginator', function() {

        var calculatePages = function(totalValue, perPage) {
            return Math.ceil(totalValue/perPage);
        };

        return {
            scope: {
                total: '=',
                current: '=',
                perPage: '=',
                baseUrl: '='
            },
            priority: 0,
            terminal:false,
            template: '',
            templateUrl: '/static/app/common/views/paginator.html',
            replace: false,
            transclude: false,
            restrict: 'A',
            controller: function ($scope, $element, $attrs, $transclude) {

                $scope.max = function(total, perPage) {
                    return Math.ceil(total/perPage);
                };

                $scope.range = function(max) {
                    return new Array(Math.ceil(max));
                };
            }
        }
    })
;