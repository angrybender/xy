var Geometry = {

    //Функция создает вектор из двух точек A,B.
    CreateVector : function(A,B) {
        return {
            x : B.x - A.x,
            y : B.y - A.y,
            z : B.z - A.z
        };
    },

    //Векторное произведение
    VectorProduct : function(A,B) {
        return {
            x : A.y*B.z-B.y*A.z,
            y : A.z*B.x-B.z*A.x,
            z : A.x*B.y-B.x*A.y
        };
    },

    //Скалярное произведение
    DotProduct : function(A,B) {
        return A.x*B.x + A.y*B.y + A.z*B.z;
    },

    //Привести длину вектора к единице
    Normalize : function(A) {
        var R,mlr;
        mlr = Math.sqrt(A.x*A.x+A.y*A.y+A.z*A.z);

        A.x = A.x/mlr;
        A.y = A.y/mlr;
        A.z = A.z/mlr;

        return A;
    },

    // длина вектора
    VectorLength : function(A) {
        return Math.sqrt(A.x*A.x+A.y*A.y+A.z*A.z);
    },

    /**
     * принадлежит ли точка треугльнику (двумерный случай
     * p1 - p3: вершины треугольника, ptest: проверяемая точка.
     */
    point2triangle : function( p1,  p2,  p3, ptest ) {
        var a = (p1.x - ptest.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p1.y - ptest.y);
        var b = (p2.x - ptest.x) * (p3.y - p2.y) - (p3.x - p2.x) * (p2.y - ptest.y);
        var c = (p3.x - ptest.x) * (p1.y - p3.y) - (p1.x - p3.x) * (p3.y - ptest.y);

        if ((a >= 0 && b >= 0 && c >= 0) || (a <= 0 && b <= 0 && c <= 0))
            return true;
        else
            return false;
    },

    // угол между векторами
    vector_angle : function(A,B) {
        //console.log(B);
        var cos =this.DotProduct(A,B)/(this.VectorLength(A)*this.VectorLength(B));
        return 180*Math.acos(cos)/Math.PI;
    },

    /**
     * пересечение луча и квадрата (начальная точка луча - X )
     Итак на входе у нас 4 точки квадрата A,B,C, D и две точки прямой X,Y
     */
    line2square : function(A,B,C,D,X,Y) {
        //console.log(this.CreateVector(X,Y));
        var NotIntersectPlaneLine = true;

        var N =  this.VectorProduct(this.CreateVector(A,B),this.CreateVector(A,C));
        this.Normalize(N);
        var V = this.CreateVector(X,A);
        // расстояние до плоскости по нормали
        var d = this.DotProduct(N,V);
        var W = this.CreateVector(X,Y);
        // приближение к плоскости по нормали при прохождении отрезка
        var e = this.DotProduct(N,W);


        if ( e !== 0 ) { // одна точка
            //в любом другом случае(принадлежит, или параллельна плоскости)
            //флаг сигнализирующий что единственная точка не найдена будет правдой
            var IntersectVector={x:0,y:0,z:0};
            IntersectVector.x = X.x  +  W.x*d/e;
            IntersectVector.y = X.y  +  W.y*d/e;
            IntersectVector.z = X.z  +  W.z*d/e;


            var material = new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture( 'd_mat3.jpg',new THREE.UVMapping(),function(){
                    D3.redraw();
                }),
                overdraw: true
            });


            var planeGeo = new THREE.PlaneGeometry(8, 8, 1, 1);
            var planeMat = new THREE.MeshLambertMaterial(material);
            var plane = new THREE.Mesh(planeGeo, planeMat);
            plane.position=IntersectVector;
            plane.position.z = plane.position.z-100;
            plane.rotation.y = -Math.PI;
            D3.scene.add(plane);

            //console.log(IntersectVector,A,B,C,D);

            // редуцирование координат до 2х мерного случая
            if (A.x==B.x==C.x==D.x ) {
                A.x = A.z;
                B.x = B.z;
                C.x = C.z;
                X.x = X.z;
                Y.x = Y.z;
                IntersectVector.x = IntersectVector.z;
            }
            if (A.y==B.y==C.y==D.y ) {
                A.y = A.z;
                B.y = B.z;
                C.y = C.z;
                X.y = X.z;
                Y.y = Y.z;
                IntersectVector.y = IntersectVector.z;
            }

            // проверка сонаправленности векторов (0,IntersectVector) и (X,Y)
            var view_ray = this.CreateVector(X,Y);
            if ( !(view_ray.x/IntersectVector.x > 0 && view_ray.y/IntersectVector.y>0) ) {
                if ( this.point2triangle(A,B,C,IntersectVector) ) return true;
                if ( this.point2triangle(A,D,C,IntersectVector) ) return true;
                //if ( this.point2triangle(B,D,C,IntersectVector) ) return true;
                //if ( this.point2triangle(A,D,B,IntersectVector) ) return true;
            }

            return false;
        }

        throw "Geometry.line2square unexpected calculating"; // ITS BUG !
        return false; // ITS BUG !
    }

}

var D3 = {
    projector : null,
    scene : null,
    camera : null,
    renderer : null,
    light : null,
    is_WebGL : true,
    pano_id : '',
    redraw : function() {
        this.renderer.render(this.scene, this.camera.object);
    }
};

function get_coord(e) {
    var x,y;
    if (e.pageX)
    {
        x = e.pageX;
        y = e.pageY;
    }
    else if (e.clientX)
    {
        x = e.clientX+(document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
        y = e.clientY+(document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
    }

    return [x,y];
}

function panorama($conteiner,active_pano_id,max_panorama_width,min_panorama_width,start_fov,start_params) {

    D3.pano_id=active_pano_id;

    if ( typeof  start_params  == "undefined" ) {
        start_params={};
        start_params.angle = [Math.PI*180,-30];
        start_params.fov = start_fov;
    }

    Math.float_eq = function(c1,c2) {
        return (Math.abs(c1-c2)<0.0001);
    }

    Math.logof2 = Math.log(2);
    Math.log2 = function(number) {
        return Math.log(number) / Math.logof2;
    };

    var is_need_load_event=true;
    _.extend(D3,Backbone.Events);

    var MAX_CACHED_MESH=50;
    var QUANT_FOV=50;
    var START_FOV = start_fov;
    var TILES_SIZE = 512;
    var MIN_FOV = (start_fov/(max_panorama_width/min_panorama_width))/2;
    var STEP_FOV = (start_fov-MIN_FOV)/QUANT_FOV;

    var conteiner_width=$conteiner.width() , conteiner_height=$conteiner.height();

    function panorama_calculate_size(FOV) {

        var zoom_step = Math.round(Math.log2(FOV/MIN_FOV));
        var width = max_panorama_width/Math.pow(2,zoom_step);

        if ( width>max_panorama_width ) width = max_panorama_width;
        //console.log(width);

        if ( width<4096 ) width=4096;
        if ( width == 65536*2 ) {
            width = 119808;
            TILES_SIZE = 468;
        } else {
            TILES_SIZE = 512;
        }

        return width;
    }

    var camera_class = function(camera) {
        camera.position.z = 0;
        camera.position.x = 0;
        camera.position.y = 0;
        this.object = camera;
        this.fov_step= STEP_FOV;
        this.angles = start_params.angle;
        var self=this;
        var ang_delta=5;
        this.directional();
        this.is_moved = false;
        var is_lock_events = false;
        observer.on('panorama:lock_mouse_events', function(){
            is_lock_events = true;
        });
        observer.on('panorama:unlock_mouse_events', function(){
            is_lock_events = false;
        });

        var index_w = $(window).width();
        var index_h = $(window).height();

        observer.on('panorama:set_zoom', function(fov){
            camera.fov = fov;
            if ( camera.fov<MIN_FOV ) {
                camera.fov=MIN_FOV;
            }

            if ( camera.fov>START_FOV ) {
                camera.fov=START_FOV;
            }

            if (!self.directional_limits()) {
                self.object.lookAt({
                    x:Math.sin(self.angles[0]/180),
                    y:Math.sin(self.angles[1]/180),
                    z:Math.cos(self.angles[0]/180)
                });
            }

            camera.updateProjectionMatrix();
            Pano.renew();
        });


        $('body').unbind('mousewheel.panorama').bind('mousewheel.panorama',function(e,dir){

            if ( is_lock_events ) return true;
            if ( $(e.target)[0].tagName.toLowerCase() != 'canvas' ) return true;

            if ( dir>0 )
                camera.fov = camera.fov-self.fov_step;
            else
                camera.fov = camera.fov+self.fov_step;

            if ( camera.fov<MIN_FOV ) {
                camera.fov=MIN_FOV;
            }

            if ( camera.fov>START_FOV ) {
                camera.fov=START_FOV;
            }

            if (!self.directional_limits()) {
                self.object.lookAt({
                    x:Math.sin(self.angles[0]/180),
                    y:Math.sin(self.angles[1]/180),
                    z:Math.cos(self.angles[0]/180)
                });
            }

            camera.updateProjectionMatrix();
            Pano.renew();

            controllers.main.navigate('/panorama/'+D3.pano_id+';'+Math.round(D3.camera.angles[0]*1000)+';'+Math.round(D3.camera.angles[1]*1000)+';'+Math.round(D3.camera.object.fov*1000));
            observer.trigger('panorama:zoom');

            return false;
        });
        var drop_flag = false;
        var start_coord = [];

        $conteiner.find('canvas:first').mousedown(function(e){
            start_coord  = get_coord(e);
            start_coord[2] = self.angles[0];
            start_coord[3] = self.angles[1];
            drop_flag = true;
            $conteiner.addClass('moving');
            self.is_moved = false;
        });
        $conteiner.find('canvas:first').mouseup(function(){
            drop_flag = false;
            $conteiner.removeClass('moving');
            is_lock_events = false;

            controllers.main.navigate('/panorama/'+D3.pano_id+';'+Math.round(D3.camera.angles[0]*1000)+';'+Math.round(D3.camera.angles[1]*1000)+';'+Math.round(D3.camera.object.fov*1000));
            self.directional(true);
        });
        $conteiner.find('canvas:first').mouseout(function(){
            if ( drop_flag ) {
                drop_flag = false;
                $conteiner.removeClass('moving');
                is_lock_events = false;
                self.directional(true);
            }
        });
        $conteiner.find('canvas:first').mousemove(function(e){
            self.is_moved = true;

            if ( !drop_flag || is_lock_events ) return true;
            var this_coord = get_coord(e);

            var delta_x = this_coord[0]-start_coord[0];
            var delta_y = this_coord[1]-start_coord[1];

            self.angles[0] = start_coord[2] + 10*Math.atan(delta_x/Pano.width)*180/Math.PI;
            self.angles[1] = start_coord[3] + 10*Math.atan(delta_y/Pano.width)*180/Math.PI;
            observer.trigger('panorama:rotate');

            self.directional(false);
        });
    };
    camera_class.prototype.object=null;
    camera_class.prototype.angles = [];
    camera_class.prototype.fov_step=0;
    camera_class.prototype.fov_step_quant=QUANT_FOV;
    camera_class.prototype.fov_min=MIN_FOV;
    camera_class.prototype.directional = function(is_renew) {

        this.directional_limits();
        //{
        this.object.lookAt({
            x:Math.sin(this.angles[0]/180),
            y:Math.sin(this.angles[1]/180),
            z:Math.cos(this.angles[0]/180)
        });

        if ( D3.scene !== null && is_renew ) {
            Pano.renew(true);
        } else if ( D3.scene !== null ) {
            D3.redraw();
        }
        //}
    }
    camera_class.prototype.directional_limits = function() {
        if ( D3.pano_id == 'first' ) {
            var limits = [
                {
                    fov : 26,
                    top : -19.9,
                    bottom : -32.9,
                    left : 756,
                    right : 377
                },
                {
                    fov : MIN_FOV,
                    top : 17.2,
                    bottom : -75,
                    left : 835,
                    right : 290
                }
            ];
        } else if ( D3.pano_id == 'second' ) {
            var limits = [
                {
                    fov : 26,
                    top : 30,
                    bottom : -45,
                    left : 780,
                    right : 347
                },
                {
                    fov : MIN_FOV,
                    top : 17.2,
                    bottom : -85,
                    left : 835,
                    right : 260
                }
            ];
        } else if ( D3.pano_id == 'forth' ) {
            var limits = [
                {
                    fov : 26,
                    top : -1,
                    bottom : -36,
                    left : 720,
                    right : 415
                },
                {
                    fov : MIN_FOV,
                    top : 15,
                    bottom : -82,
                    left : 800,
                    right : 320
                }
            ];
        } else if ( D3.pano_id == 'third' ) {
            var limits = [
                {
                    fov : 26,
                    top : -1,
                    bottom : -36,
                    left : 699,
                    right : 435
                },
                {
                    fov : MIN_FOV,
                    top : 15,
                    bottom : -82,
                    left : 780,
                    right : 290
                }
            ];
        }

        var delta_fov = limits[0].fov-limits[1].fov;
        var top = (1 - (limits[0].fov-this.object.fov)/delta_fov)*limits[0].top + (1 - (this.object.fov-limits[1].fov)/delta_fov)*limits[1].top;
        var bottom = (1 - (limits[0].fov-this.object.fov)/delta_fov)*limits[0].bottom + (1 - (this.object.fov-limits[1].fov)/delta_fov)*limits[1].bottom;
        var left = (1 - (limits[0].fov-this.object.fov)/delta_fov)*limits[0].left + (1 - (this.object.fov-limits[1].fov)/delta_fov)*limits[1].left;
        var right = (1 - (limits[0].fov-this.object.fov)/delta_fov)*limits[0].right + (1 - (this.object.fov-limits[1].fov)/delta_fov)*limits[1].right;
        //console.log(left,right);

        var is_valid = true;
        if ( this.angles[1] > top ) {
            this.angles[1] = top;
            is_valid = false;
        }

        if ( this.angles[1] < bottom ) {
            this.angles[1] = bottom;
            is_valid = false;
        }

        if ( this.angles[0] < right ) {
            this.angles[0] = right;
            is_valid = false;
        }

        if ( this.angles[0] > left ) {
            this.angles[0] = left;
            is_valid = false;
        }

        if ( Math.abs(this.angles[0]-right)<10 )   {
            $('.panorama-conteiner .pano-switch.right').addClass('show');
        } else {
            $('.panorama-conteiner .pano-switch.right').removeClass('show');
        }

        if ( Math.abs(this.angles[0]-left)<10 ) {
            $('.panorama-conteiner .pano-switch.left').addClass('show');
        } else {
            $('.panorama-conteiner .pano-switch.left').removeClass('show');
        }

        return is_valid;
    }

    function initialize_3d_env() {

        D3.projector = new THREE.Projector();

        //Feature test WebGL
        (function() {
            try {
                var canvas = document.createElement('canvas');

                if (typeof canvas.getContext('webgl')!="undefined" || typeof canvas.getContext('experimental-webgl') != "undefined" )
                {
                    D3.renderer = new THREE.WebGLRenderer({antialias: true});
                } else {
                    D3.is_WebGL = false;
                    D3.renderer = new THREE.CanvasRenderer();
                }

            } catch(e) {
                D3.is_WebGL = false;
                D3.renderer = new THREE.CanvasRenderer();
            }
        })();

        D3.renderer.setSize(conteiner_width, conteiner_height);
        $conteiner[0].appendChild(D3.renderer.domElement);

        D3.renderer.setClearColorHex(0xffffff, 1.0);
        D3.renderer.clear();

        var width = D3.renderer.domElement.width; // ширина сцены
        var height = D3.renderer.domElement.height; // высота сцены
        var aspect = width / height; // соотношение сторон экрана
        var near = 1; // минимальная видимость
        var far = conteiner_width/(Math.tan( Math.PI * START_FOV/360))*2000; // максимальная видимость
        var camera = new THREE.PerspectiveCamera( start_params.fov, aspect, near, far );
        D3.camera = new camera_class( camera );
        D3.scene = new THREE.Scene();

        //D3.light = new THREE.AmbientLight( 0xffffff);
        //D3.scene.add( D3.light );
    }
    initialize_3d_env();

    var panorama_class = function() {
        this._elements_cnt=0;
        this._loaded_cnt=0;

        this.pLocal = new THREE.Vector3( 0, 0, -1 );
        this.renew();
        this.peloader_cube(); // рисует куб=прелоадер
        var self = this;

        this.prev_cube=false;
        this.curr_cube=false;

        $conteiner.find('canvas:first').unbind('click.panorama').bind('click.panorama',function(e){
            if ( !D3.camera.is_moved ) {

                var position = get_coord(e);

                var vector = new THREE.Vector3( ( position[0] / conteiner_width ) * 2 - 1, - ( position[1] / conteiner_height ) * 2 + 1, 0.5 );
                D3.projector.unprojectVector(vector,D3.camera.object);
                var raycaster = new THREE.Raycaster( D3.camera.object.position, vector.sub( D3.camera.object.position ).normalize() );
                var intersects = raycaster.intersectObjects( D3.scene.children );

                if ( intersects.length>0 ) {
                    if ( document.domain == 'philips' ) {
                        for (var i in intersects) {
                            console.log(intersects[i].object.material.map.image.attributes[0]);
                        }
                    }
                    for (var i in intersects) {
                        if ( intersects[i].object.material.map.image.attributes[0].nodeValue.indexOf('?')>-1 ) {
                            model_game.last_src = intersects[i].object.material.map.image.attributes[0].nodeValue;
                        }
                    }


                    var temp_coord = intersects[0].point.y;
                    intersects[0].point.y = 0;
                    var xz_angle = Geometry.vector_angle({x:0,y:0,z:1},intersects[0].point);

                    intersects[0].point.y = temp_coord;
                    intersects[0].point.x = 0;
                    var yz_angle = Geometry.vector_angle({x:0,y:0,z:1},intersects[0].point);

                    D3.trigger("panorama:click",xz_angle,yz_angle,D3.camera.object.fov);
                }
            }
        });
    };
    panorama_class.prototype.pano_id = active_pano_id; // какая сейчас активная панорама
    // рисует куб=прелоадер
    panorama_class.prototype.peloader_cube = function() {
        var self = this;
        var x, y, z, plane_angle, plane_angle_axe, plane_coord={},texture_x=0;
        var NEED_TILES_COUNT = 256; // запас
        var TILES_SIZE = NEED_TILES_COUNT*4096;
        var meshcnt = 1;
        if ( !D3.is_WebGL ) meshcnt = 10;

        // back
        var cube_type = ['front','right','left'];//,'back','top','bottom'];

        var preloader_get_texture = function(type) {
            return '/pano_preloader/' + self.pano_id + '/'+type+'.jpg';
        }

        for ( var type in cube_type ) {
            for (x=0;x<1;x++) {
                for (y=0;y<1;y++) {

                    texture_x=x;
                    if ( cube_type[type] == 'front' ) {
                        plane_coord.x = 0;
                        plane_coord.y = 0;
                        plane_coord.z = -TILES_SIZE/2;
                        plane_angle = 0;
                    }

                    if ( cube_type[type] == 'right' ) {
                        plane_coord.x = TILES_SIZE/2;
                        plane_coord.y = 0;
                        plane_coord.z = 0;
                        plane_angle = -Math.PI/2;
                        plane_angle_axe='y';
                    }

                    if ( cube_type[type] == 'left' ) {
                        plane_coord.z= 0;
                        plane_coord.y= 0;
                        plane_coord.x= -TILES_SIZE/2;
                        plane_angle = Math.PI/2;
                        plane_angle_axe='y';
                        texture_x = NEED_TILES_COUNT-x-1;
                    }

                    if ( cube_type[type] == 'back' ) {
                        plane_coord.x=-TILES_SIZE/2;
                        plane_coord.y=-TILES_SIZE/2;
                        plane_coord.z=TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_angle = -Math.PI;
                        plane_angle_axe='y';
                        texture_x = NEED_TILES_COUNT-x-1;
                    }

                    if ( cube_type[type] == 'top' ) {
                        plane_coord.x=-TILES_SIZE/2;
                        plane_coord.z=-TILES_SIZE/2;
                        plane_coord.y=TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_angle = Math.PI/2;
                        plane_angle_axe='x';
                    }

                    if ( cube_type[type] == 'bottom') {

                        plane_coord.x=-TILES_SIZE/2;
                        plane_coord.z=-TILES_SIZE/2;
                        plane_coord.y=-TILES_SIZE*NEED_TILES_COUNT/2;
                        texture_x = NEED_TILES_COUNT-x-1;
                        plane_angle = -Math.PI/2;
                        plane_angle_axe='x';
                    }

                    (function(type,texture_x,y,plane_coord,plane_angle_axe,plane_angle,texture){
                        var plane=false;
                        var trigger_load = false;
                        var material = new THREE.MeshBasicMaterial({
                            //color : 0x000000,
                            overdraw: true,
                            opacity: 1
                        });

                        material.map = THREE.ImageUtils.loadTexture( texture, new THREE.UVMapping(),function(){
                            D3.redraw();
                        });
                        //material.map.scale.x = NEED_TILES_COUNT;
                        //material.map.scale.y = NEED_TILES_COUNT;

                        var planeGeo = new THREE.PlaneGeometry(TILES_SIZE, TILES_SIZE, meshcnt, meshcnt);
                        //var planeMat = new THREE.MeshLambertMaterial(material);
                        //planeMat.scale(NEED_TILES_COUNT,NEED_TILES_COUNT);
                        plane = new THREE.Mesh(planeGeo, material);

                        plane.name = 'preloader';
                        plane.position.x=plane_coord.x;
                        plane.position.y=plane_coord.y;
                        plane.position.z=plane_coord.z;
                        if ( plane_angle != 0 ) plane.rotation[plane_angle_axe] = plane_angle;
                        D3.scene.add(plane);
                        D3.redraw();
                    })(type,texture_x,y,plane_coord,plane_angle_axe,plane_angle,preloader_get_texture(cube_type[type]));
                }
            }
        }
    }
    panorama_class.prototype.pLocal=null;
    panorama_class.prototype.width=0;
    panorama_class.prototype.renew = function(no_recalcucate_width) {
        // определение направления взгляда камеры
        // находим угол между лучом точки обзора камеры и цетром квадрата
        var camera_direction_vec = {
            x: TILES_SIZE*Math.sin(D3.camera.angles[0]/180),
            y: TILES_SIZE*Math.sin(D3.camera.angles[1]/180),
            z: TILES_SIZE*Math.cos(D3.camera.angles[0]/180)
        };

        if ( typeof no_recalcucate_width == "undefined" ) {
            var new_pano_width = panorama_calculate_size(D3.camera.object.fov);
            if ( this.width != new_pano_width ) {
                this.width = new_pano_width;
                this.build_model();
            }
        }

        // рисуем куб
        this.draw_cube(camera_direction_vec);

        D3.redraw();
    }
    panorama_class.prototype.build_model = function() {
        // remove all tiles:
        var obj, i;
        for ( i = D3.scene.children.length - 1; i >= 0 ; i -- ) {
            obj = D3.scene.children[ i ];
            if ( typeof obj.material != "undefined" && obj.name != 'preloader' ) {
                D3.scene.remove(obj);
            }
        }
    }

    panorama_class.prototype.get_texture = function(type,x,y) {
        return "/game/gettile/"+(Math.random().toString().replace('.',''))+"?pano="+this.pano_id+"&x="+x+"&y="+y+"&width="+this.width+"&type="+type+"&tag="+Math.random();
        //return "/game/gettile/"+"?x="+x+"&y="+y+"&width="+this.width+"&type="+type;//+"&tag="+Math.random();
    }

    panorama_class.prototype.draw_cube = function(camera_direction_vec) { // camera_direction_vec: {x:,y:,z:}

        var self=this;
        var angle, type;
        var max_angle = D3.camera.object.fov*1.8;
        //if ( max_angle<10 ) max_angle = 10;

        var object_hash = {};
        var obj, i;
        var invisible_mesh = 0;
        for ( i = D3.scene.children.length - 1; i >= 0 ; i -- ) {
            obj = D3.scene.children[ i ];
            if ( typeof obj.material != "undefined" && obj.name != 'preloader' ) {
                // visibility test:
                angle = Geometry.vector_angle(obj.position, camera_direction_vec);

                if ( angle <= max_angle ) {
                    object_hash[obj.position.x+"_"+obj.position.y+"_"+obj.position.z] = true;
                } else {
                    invisible_mesh++;
                    if ( invisible_mesh>MAX_CACHED_MESH )
                        D3.scene.remove(obj);
                }
            }
        }

        var x, y, z, plane_angle, plane_angle_axe, plane_coord={},texture_x=0;
        var NEED_TILES_COUNT = this.width/TILES_SIZE;
        var meshcnt = 1;
        if ( !D3.is_WebGL ) meshcnt = 10;

        // back
        var cube_type = ['front','right','left'];//,'back','top','bottom'];

        for ( type in cube_type ) {
            var start_x = 0;
            var end_y = Math.round(2*NEED_TILES_COUNT/3);
            var end_x=NEED_TILES_COUNT;

            if ( type == 'left' ) start_x = Math.floor(NEED_TILES_COUNT/3);
            if ( type == 'right' ) end_x = Math.floor(2*NEED_TILES_COUNT/3)+1;
            for (x=start_x;x<end_x;x++) {
                for (y=0;y<=end_y;y++) {

                    texture_x=x;
                    if ( cube_type[type] == 'front' ) {
                        plane_coord.x = x*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.y = y*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.z = -TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_angle = 0;
                    }

                    if ( cube_type[type] == 'right' ) {
                        plane_coord.x = TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.y = y*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.z = x*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_angle = -Math.PI/2;
                        plane_angle_axe='y';
                    }

                    if ( cube_type[type] == 'left' ) {
                        plane_coord.z=x*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.y=y*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.x=-TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_angle = Math.PI/2;
                        plane_angle_axe='y';
                        texture_x = NEED_TILES_COUNT-x-1;
                    }

                    if ( cube_type[type] == 'back' ) {
                        plane_coord.x=x*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.y=y*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.z=TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_angle = -Math.PI;
                        plane_angle_axe='y';
                        texture_x = NEED_TILES_COUNT-x-1;
                    }

                    if ( cube_type[type] == 'top' ) {
                        plane_coord.x=x*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.z=y*TILES_SIZE+TILES_SIZE/2 - TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.y=TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_angle = Math.PI/2;
                        plane_angle_axe='x';
                    }

                    if ( cube_type[type] == 'bottom') {

                        plane_coord.x=-x*TILES_SIZE-TILES_SIZE/2 + TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.z=-y*TILES_SIZE-TILES_SIZE/2 + TILES_SIZE*NEED_TILES_COUNT/2;
                        plane_coord.y=-TILES_SIZE*NEED_TILES_COUNT/2;
                        texture_x = NEED_TILES_COUNT-x-1;
                        plane_angle = -Math.PI/2;
                        plane_angle_axe='x';
                    }

                    if ( typeof object_hash[plane_coord.x+"_"+plane_coord.y+"_"+plane_coord.z] != "undefined" ) continue;

                    angle = Geometry.vector_angle(plane_coord, camera_direction_vec);

                    if ( angle <= max_angle ) {

                        self._elements_cnt++;
                        (function(type,texture_x,y,plane_coord,plane_angle_axe,plane_angle,texture){
                            var plane=false;
                            var trigger_load = false;
                            var material = new THREE.MeshBasicMaterial({
                                //color : 0x000000,
                                overdraw: true
                            });

                            material.map = THREE.ImageUtils.loadTexture( texture, new THREE.UVMapping(),function(){
                                self._loaded_cnt++;
                                if ( is_need_load_event && (self._loaded_cnt>5) && (self._elements_cnt-self._loaded_cnt<5) ) {
                                    observer.trigger('panorama:loaded');
                                    is_need_load_event=false;
                                }

                                plane.visible = true;
                                D3.redraw();
                            });

                            var planeGeo = new THREE.PlaneGeometry(TILES_SIZE, TILES_SIZE, meshcnt, meshcnt);
                            var planeMat = new THREE.MeshBasicMaterial(material);
                            plane = new THREE.Mesh(planeGeo, planeMat);
                            plane.visible = false;

                            plane.position.x=plane_coord.x;
                            plane.position.y=plane_coord.y;
                            plane.position.z=plane_coord.z;
                            if ( plane_angle != 0 ) plane.rotation[plane_angle_axe] = plane_angle;
                            D3.scene.add(plane);
                            D3.redraw();
                        })(type,texture_x,y,plane_coord,plane_angle_axe,plane_angle,this.get_texture(cube_type[type],texture_x,NEED_TILES_COUNT-y-1));
                    }
                }
            }
        }
    }

    var Pano = new panorama_class();


    D3.on("panorama:click",function(x, y, fov){
        console.log('H: '+x+" / P: "+y);
        //$('#click').html( Math.round(xz_angle*100)/100+ " / " + Math.round(yz_angle*100)/100 + " / " + D3.camera.object.fov );
    });
}

function panorama_destroy() {
    D3.projector = null;
    D3.scene = null;
    D3.camera = null;
    D3.renderer = null;
    D3.light = null;
}