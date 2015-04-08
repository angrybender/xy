var view_class_panorama_compass = {

    el         : 'body',
    is_rendered: false,
    angle      : {compass_a:0,compass_b:180},
    zoom_button: null,
    zoom_helper: null,
    height     : 0,
    width      : 0,
    canvas     : null,
    is_init    : false,
    drop_flag  : false,
    base_x     : 0,
    base_y     : 0,
    is_npc     : false,
    is_catch   : false,

    events: {
        /*'mousedown .panorama-conteiner'                       : 'zoom_helper_event',
         'mouseup .panorama-conteiner .component-compass .zoom': 'zoom_helper_event',
         'mousemove .panorama-conteiner'                       : 'zoom_helper_event',
         */
        'click .component-compass .bzoom.minus' :           'zoom_minus',
        'click .component-compass .bzoom.plus' :            'zoom_plus',
        'mousedown .page-panorama' :                        'zoom_mouse_event_md',
        'mouseup .page-panorama' :                          'zoom_mouse_event_mu',
        'mousemove .page-panorama' :                        'zoom_mouse_event_mm',
        'click .sections.component-menu .panorams-switcher-popup button' :     'panorama_switch'
    },

    zoom_mouse_event_md : function(e) {
        if ( !this.is_rendered ) return true;
        if ( $(e.target).closest('.zoom-button').length>0 ) {
            this.is_catch=true;
            this.base_x = $('.component-compass').offset().left + $('.component-compass').width()/2;
            this.base_y = 59 + $('.component-compass').offset().top + $('.component-compass').height()/2;
        }
    },
    zoom_mouse_event_mu : function(e) {
        this.is_catch=false;
    },
    zoom_mouse_event_mm : function(e) {
        if ( this.is_catch ) {
            var coord = get_coord(e);
            var x = coord[0] - this.base_x;
            var y = this.base_y-coord[1];
            var g = Math.sqrt(x*x+y*y);

            if ( y<=0 ) return true;
            if ( x == 0 ) return false;

            if ( x>0 )
                var ang = 180 - Math.atan(y/x)*180/Math.PI;
            else
                var ang = - Math.atan(y/x)*180/Math.PI;

            if ( ang < 20 ) ang = 20;
            if ( ang > 160 ) ang = 160;

            rotate('.zoom-button',ang);

            var min_state = D3.camera.fov_min;
            var max_state = 26;

            var zoom_state = max_state - ( ((ang-20)/140)*(max_state-min_state) + min_state );
            observer.trigger('panorama:set_zoom',zoom_state);
        }
    },

    initialize: function () {
        var self = this;
        observer.on('panorama:compass', function (e) {
            self.angle = e;
            //{"compass_a":0,"compass_b":180}

            //self.is_init = true;
            //self.render();
            $('.component-compass .compass').show();
            self.is_npc=true;
        });

        observer.on('panorama:loaded', function () {
            self.is_rendered=false;
            self.is_init = true;
            self.is_npc=false;
            self.render();
            $('.component-compass .compass').hide();
        });

        controllers.main.on('all', function (e) {
            if (e.substr(0, 5) == 'route' && e.indexOf(':') > 0) {
                var page = e.split(':')[1];
                if (page !== 'panorama') {
                    self.is_rendered = false;
                    self.is_init = false;
                    self.canvas = null;
                    self.zoom_button = null;
                    self.zoom_helper = null;
                }
            }
        });

        observer.on('panorama:zoom', function () {
            self.zoom_renew();
        });

        observer.on('panorama:rotate', function () {

            var camera_direction_vec = {
                x: 1000*Math.sin(D3.camera.angles[0]/180),
                y: 0,
                z: 1000*Math.cos(D3.camera.angles[0]/180)
            };
            var angle = Geometry.vector_angle({
                x: 0,
                y:0,
                z:-1
            }, camera_direction_vec);

            //console.log(angle);

            if ( !self.is_npc ) return 0;

            var angles = [self.angle.compass_a, self.angle.compass_b];
            var width = 90 + (angles[0] - angles[1]);
            rotate(".compass-angle", width);
            var right_border = -90 + angles[1] + angle + Math.atan2(
                    Math.sin(D3.camera.angles[0] / 180),
                    Math.cos(D3.camera.angles[0] / 180)
                ) * 180 / (Math.PI);
            rotate(".compass-rotation", right_border);
        });
    },

    render: function () {

        if (!this.is_init) return 0;

        if (!this.is_rendered) {
            this.show();
            return 0;
        }

        return 0;
        var canvas_zoom = D3.camera.object.fov;
        var R = 75; // радиус контрола зума
        /**
         * угол поворота хелпера зума равен доли от максимальной дуги (из дизайна это 180 градусов минус дважды по 26)
         * доля равна текущему значнию FOV делить на наибольшее минус наименьшее допустимое значение FOV в панораме
         * вычисляем в радианах
         */
        var zb_angle = (26 + ((canvas_zoom - 5) / 85) * (180 - 26 * 2)) * Math.PI / 180;

        // компас кривой, делаем поправку на дельту по высоте
        var delta_y = 8 * (1 - Math.abs(zb_angle - Math.PI / 4) / Math.PI / 4);

        // коордианты хелпера зума
        var zb_x = R * Math.cos(zb_angle);
        var zb_y = R * Math.sin(zb_angle);

        this.zoom_button.set({
            left: this.width / 2 + zb_x,
            top : this.height - zb_y + 12 - delta_y
        });

        this.zoom_helper.css({
            left: this.width / 2 + zb_x - 12,
            top : this.height - zb_y - delta_y
        });

        this.canvas.renderAll();
    },

    show: function () {

        var self = this;

        $('.panorama-conteiner').append(
            "<div class='component-compass'>" +
            "<button class='bzoom plus'></button><button class='bzoom minus'></button>" +
            "<div class='compass'>" +
            "<div class='chomp0 compass-rotation'>" +
            "<div class='chomp1'>" +
            "<div class='chomp2 compass-angle'>" +
            "<div class='chomp3'>" +
            "<div class='circle'>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "<div class='component-shadow'></div>" +
            "<div class='zoom-button'>" +
            "<div class='control'>" +
            "</div>" +
            "</div>" +
            "</div>"
        );

        this.zoom_helper = $('.panorama-conteiner .component-compass .zoom');
        var $wrapper = $('.panorama-conteiner .component-compass');

        this.zoom_renew();

        /*this.canvas = new fabric.StaticCanvas('panorama_compass');
         this.height = $wrapper.height();
         this.width = $wrapper.width();
         this.canvas.setWidth(this.width);
         this.canvas.setHeight(this.height);*/

        this.base_x = $('.panorama-conteiner').offset().left;// - this.width/2;
        this.base_y = $('.panorama-conteiner').offset().top;// -  this.height/2;

        /*fabric.Image.fromURL('/img/panorama/controls/bg.png', function (oImg) {
         oImg.set({
         left: oImg.width / 2,
         top : oImg.height / 2
         });
         self.canvas.add(oImg);

         fabric.Image.fromURL('/img/panorama/controls/zoom_button.png', function (oImg) {
         self.zoom_button = oImg;
         oImg.set({
         left: 0,
         top : 0
         });
         self.canvas.add(oImg);
         self.render();
         });
         });*/

        this.is_rendered = true;
    },

    zoom_helper_event: function (e) {

        /*if ( !this.is_rendered ) return false;

         if (e.type == 'mousedown' ) {
         this.drop_flag = true;
         observer.trigger('panorama:lock_mouse_events');

         var x = get_coord(e)[0]- this.base_x;
         var y = get_coord(e)[1] - this.base_y;
         //console.log(x,y);
         }

         if (e.type == 'mouseup' ) {
         this.drop_flag = false;
         observer.trigger('panorama:unlock_mouse_events');
         }

         if (e.type == 'mousemove' ) {
         if ( this.drop_flag ) {
         var x = get_coord(e)[0]- this.base_x;
         var y = get_coord(e)[1] - this.base_y;



         if ( y!=0 ) {
         var angle = Math.atan(x/y)*180/Math.PI;
         //console.log(angle);
         }
         }
         }*/
    },

    zoom_renew : function() {
        var zoom_state = D3.camera.object.fov;
        var min_state = D3.camera.fov_min;
        var max_state = 26;
        var min_slider_state = 20;
        var max_slider_state = 160;
        var slider_state = -(max_slider_state-min_slider_state)*(zoom_state-min_state)/(max_state-min_state) + max_slider_state;
        rotate('.zoom-button', slider_state);
    },

    zoom_minus : function() {
        var zoom_state = D3.camera.object.fov+D3.camera.fov_step;
        observer.trigger('panorama:set_zoom',zoom_state);
        this.zoom_renew();
    },
    zoom_plus : function() {
        var zoom_state = D3.camera.object.fov-D3.camera.fov_step;
        observer.trigger('panorama:set_zoom',zoom_state);
        this.zoom_renew();
    },

    // переключение с одной пары панорам на другую
    panorama_switch : function(e) {

        var pano_id = $(e.target).hasClass('pano1') ? 'first' : 'third';

        var current='first';
        if ( D3.pano_id == 'third' || D3.pano_id == 'forth' ) {
            current = 'third';
        }

        if ( current == pano_id && D3.pano_id !== '' ) return 0;
        $('.component-top-menu .sections.component-menu .panorams-switcher-popup').removeClass('opened');

        if ( D3.pano_id !== '' ) {
            var url =
                'panorama/'+
                pano_id+';'+
                Math.round(D3.camera.angles[0]*1000)+';'+
                Math.round(D3.camera.angles[1]*1000)+';'+
                '26000';
        } else {
            var url = 'panorama/'+pano_id;
        }


        document.location.hash = url;
    }
}