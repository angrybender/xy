
$(function() {

    $('#container').width(1000).height(1000);
    var widths = [100, 200, 500];
    var height = [50, 100, 200];

    for (var i = 0; i < 20; i++) {
        $('#container').append('<div class="item"></div>');
        $('#container div:last').css({
            width: widths[Math.round(Math.random()*2)],
            height: height[Math.round(Math.random()*2)],
            background: 'url(http://lorempixel.com/400/400?' + Math.random() + ') center'
        });
    }

    xy($('#container'), '.item', 100, 50);
});