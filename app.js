
$(function() {

    $('#container').width(1000).height(1000);
    var widths = [50, 100, 200];
    var height = [50, 100, 200];

    for (var i = 0; i < 20; i++) {
        $('#container').append('<div class="item"></div>');
        $('#container div:last').style({
            width: widths[Math.round(Math.random()*3)],
            height: widths[Math.round(Math.random()*3)],
            background: 'url(http://lorempixel.com/200/200) center'
        });
    }

    xy($('#container'), '.item', 50, 50);
});