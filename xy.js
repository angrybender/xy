
function xy($wrapper,s_elem,min_w,min_h) {
    $wrapper.css('position' , 'relative' );

    // кешируем элементы, узнаем квант ширины и высоты
    var elements = [];
    var cnt = 0;
    if ( typeof min_h == "undefined" || typeof min_w == "undefined" ) {
        var min_w = 999999;
        var min_h = 999999;
    }
    var max_h=0;
    $wrapper.find(s_elem).each(function() {
        cnt++;
        elements.push({
            w : $(this).width(),
            h : $(this).height(),
            x : -1,
            y : -1,
            is_placed : false
        });

        if ( typeof min_h == "undefined" || typeof min_w == "undefined" ) {
            if ( $(this).width() < min_w )
                min_w = $(this).width();

            if ( $(this).height() < min_h )
                min_h = $(this).height();
        }

        if ( $(this).height()>max_h )
            max_h = $(this).height();
    });
    max_h = max_h/min_h;

    // дискретизируем ширину и высоту элементов
    var max_pess_h = 0; // наихудшая высота
    for (var i in elements) {
        elements[i].w = Math.round(elements[i].w/min_w);
        elements[i].h = Math.round(elements[i].h/min_h);
        max_pess_h = max_pess_h+elements[i].h;
    }


    // строим "полотно" как двумерный массив (матрицу [0,1])
    var canvas = [];
    var canvas_w = Math.floor( $wrapper.width()/min_w );

    var x, y,row=[];
    for ( y=0;y<max_pess_h;y++ ) {
        row = [];
        for (x=0;x<canvas_w;x++) {
            row.push(0);
        }

        canvas.push(row);
    }

    /**
     * возвращает координаты всех пустых мест в 1 строке,
     * поиск начинается с переданной строки
     * ложь если ничего не найдено
     */
    function get_max_space(start_line) {
        var spaces = [];
        var is_found=false;
        var start_x= -1,end_x=-1;
        var i,j;
        for (y=start_line;y<max_pess_h;y++) {

            is_found=false;
            start_x=-1;
            end_x=-1;
            spaces = [];
            for (x=0;x<canvas_w;x++) {

                if ( canvas[y][x] == 0 && !is_found ) { // нашли пустую ячейку - ставим флаг что найдено, запоминаем координаты
                    start_x = x;
                    is_found = true;
                }

                if ( canvas[y][x] == 1 && is_found ) { // нашли следующую не пустую - значит до нее все остальные пустые
                    spaces.push({
                        y : y,
                        x : start_x,
                        length : x-start_x
                    });
                    is_found = false;
                }

                if ( start_x >= 0 && end_x < 0 && x+1 == canvas_w ) { // дошли до конца - пустые ячейки от start_x до края
                    spaces.push({
                        y : y,
                        x : start_x,
                        length : canvas_w-start_x
                    });
                }
            }

            if ( spaces.length>0 ) {
                var _temp;
                //сортируем по минимальной длине
                for (i=0;i<spaces.length;i++) {
                    for (j=0;j<spaces.length-1;j++) {
                        if ( spaces[j+1].length < spaces[j].length ) {
                            _temp = {
                                x : spaces[j].x,
                                y : spaces[j].y,
                                length : spaces[j].length
                            }

                            spaces[j].x = spaces[j+1].x;
                            spaces[j].y = spaces[j+1].y;
                            spaces[j].length = spaces[j+1].length;

                            spaces[j+1].x = _temp.x;
                            spaces[j+1].y = _temp.y;
                            spaces[j+1].length = _temp.length;
                        }
                    }
                }
                return spaces;
            }
        }

        return false;
    }

    /**
     * пытается поместить элемент в заданное свободное место
     *
     * @param element_k
     * @param place
     * @returns {boolean} если не лезет
     */
    function add_elem(element_k,place) {
        if ( elements[element_k].w<=place.length) {

            //console.log(element_k);

            var element = elements[element_k];
            var dx,dy;
            for (dy=0;dy< element.h;dy++ ) {
                for (dx=0;dx<element.w;dx++) {
                    canvas[place.y+dy][place.x+dx] = 1;

                    //console.log(canvas[dy],dy,dx);
                }
            }

            return true;

        } else {
            return false;
        }
    }

    // размещение элементов
    (function(){

        // количество самых больших элементов
        var very_hight_elements_cnt=0;
        for ( var i in elements ) {
            if ( elements[i].h>=max_h-1 ) very_hight_elements_cnt++;
        }

        if ( very_hight_elements_cnt>3 ) very_hight_elements_cnt = 3;


        var insert = function(place,strict,placed_element_cnt) {
            var i, j, k;
            var is_founded = false;
            var is_place_space=false;

            // перебираем все свободные места пока не влезет
            for ( j=0;j<place.length;j++ ) { // циклы формируем таким образом, чтобы сначала попробовать
                // впихнуть элемент в наименьшую доступную площадь, пытаясь найти подходящий элемент среди всех

                is_founded = false;
                for (i in elements) {
                    if ( elements[i].is_placed ) continue; // элемент уже' размещен

                    // сначала размещаем самые большие элементы
                    if ( placed_element_cnt<very_hight_elements_cnt ) {
                        if ( elements[i].h<max_h-1 && elements[i].w==min_w ) continue;
                    }

                    // нет ли над линией заполненных ячеек
                    is_place_space=true;
                    for (k=0;k<elements[i].h;k++) {
                        if ( canvas[place[j].y+k][place[j].x] > 0 ) {
                            is_place_space = false;
                            break;
                        }
                    }

                    if ( !is_place_space ) continue;

                    if ( strict === false ) { // лишь бы влез
                        if ( add_elem(i,place[j]) ) { // элемент влез
                            elements[i].is_placed = true;
                            elements[i].x = place[j].x;
                            elements[i].y = place[j].y;
                            is_founded = true;
                            break;
                        }
                    } else { // влез с максимальным совпадением размера свободного места
                        if ( elements[i].w<=place[j].length &&
                            (place[j].length-elements[i].w<=2) &&
                            add_elem(i,place[j])
                        ) {
                            elements[i].is_placed = true;
                            elements[i].x = place[j].x;
                            elements[i].y = place[j].y;
                            is_founded = true;
                            break;
                        }
                    }
                }

                if ( is_founded ) return true;
            }

            return false;
        }

        var i, j, iter=0;
        var place;
        var is_founded = false;
        var placed_element_cnt=0;
        while ( placed_element_cnt<elements.length ) { // крутим до тех пор, пока не расставим все элементы
            for (y=0;y<max_pess_h;y++) { // находим подходящее место по всем строкам

                place = get_max_space(y);
                //console.log(place);
                is_founded = false;
                if ( place !== false ) {
                    if ( insert(place,true,placed_element_cnt) ) {
                        placed_element_cnt++;
                        is_founded = true;
                        break;
                    }

                    if ( !is_founded ) {
                        if ( insert(place,false,placed_element_cnt) ) {
                            placed_element_cnt++;
                            is_founded = true;
                            break;
                        }
                    }
                }

                if ( is_founded ) break;
            }

            iter++;
            if ( iter> 10*elements.length ) {
                alert("Что то пошло не так");
                break;
            };
        }


        // расстановка css правил
        for (i in elements) {
            $wrapper.find(s_elem).eq(i).css({
                position: 'absolute',
                left : min_w*elements[i].x,
                top : min_h*elements[i].y
            });
        }

        // фиксирование размеров обертки
        $wrapper.width( canvas_w*min_w );
        var max_column_height=0, column_height=0;
        var x,y;
        for ( x=0;x<canvas_w;x++ ) {
            column_height=0;
            for (y=max_pess_h-1;y>=0;y--) {
                if ( canvas[y][x] == 0 ) column_height++;
            }

            column_height = max_pess_h-column_height;
            if ( column_height>max_column_height ) max_column_height = column_height;
        }

        $wrapper.height(max_column_height*min_h);
        canvas = [];
    })();

    // DEBUG
    $('body').bind('table', function(){
        var html = '';
        var x,y;
        for ( y=0; y<canvas.length; y++) {
            html = html + "<tr>";
            for ( x=0; x<canvas[y].length; x++ ) {
                html = html + "<td>"+ canvas[y][x] +"</td>";
            }
            html = html + "</tr>";
        }

        $('#debug_table').remove();
        $(this).append("<table id='debug_table'>"+html+"</table>");
        $('#debug_table').css({
            width : '25%',
            position: 'absolute',
            'z-index' : 1999,
            right : 0,
            top: 0,
            background : '#fff'
        });
    });
}