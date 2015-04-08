/**
 * это каркас для реализации следующих возможностей
 * 1. "конструктор"
 * 2. "наследование"
 * @returns {Function}
 * @constructor
 */
var Base_class = function() {

    var class_function = function() {
        if ( typeof  this.__construct == "function" )
            this.__construct.apply(this, arguments);
    }

    var parent_class;
    for ( i in arguments ) {
        parent_class = arguments[i];
        if ( typeof parent_class == "function" ) {
            for (var prop in parent_class.prototype) {
                class_function.prototype[prop] = parent_class.prototype[prop];
            }
        }
    }

    return class_function;
}

// пример "класса"
var widgets = new Base_class();
widgets.prototype.__construct = function() {
    // базовый "конструктор" для всех классов отнаследованных от Base_class
    // все виджеты имеют общую функциональность, которая реализуется в этом классе
    // все остальные виджеты наследуются от widgets таким образом: var topmenu_widget = new Base_class(widgets);

    if ( 'init' in self ) self.init(); // общий метод для потомков, вызываемый, если определен в потомке при создании объекта
}
widgets.prototype.event = function() {
    // метод, общий для всех потомков класса widgets
}

// а тут мы хотим "наследоваться" от widgets:
var topmenu_widget = new Base_class(widgets);
topmenu_widget.prototype.init = function() {
    // при инициализации класса через new данный метод будет вызван
}

// смысл этого всего в том, что __construct общий для всех виджетов такого рода, а в init() осуществляется специфические действия
// при создании конкретного виджета