
var config = require('./config.js');
var debug = require('./debug.js');
var events = require('./global_events.js');
var utils = require('./utils.js');

var Server = require('socket.io');

var IO = null;
var Messages = {};
var Clients  = [];

/**
 * класс-хранилище сокет соединений
 * @param channel
 * @param socket
 * @constructor
 */
var Client = function(channel, socket)
{
    this.channel = channel;
    this.socket = socket;
    this.time = utils.microtime(true);
    var iam = this;

    socket.on('disconnect', function() {
        delete Messages[channel];
        iam.die();
    });

    if (Messages[channel]) {
        // досылаем отложенные сообщения
        clearTimeout(this._timeout_id);
        var iam = this;
        (function(channel) {

            iam._timeout_id = setTimeout(function() {
                iam.send(Messages[channel].message);
            }, 1000);

        })(channel);
    }
}
Client.prototype._timeout_id = 0;
Client.prototype.channel = null;
Client.prototype.socket = null;
Client.prototype.time = 0; // время рождения
Client.prototype.die = function()
{
    this.socket = null;
    this.time = 0;
}
Client.prototype.send = function(message)
{
    if (this.socket) {
        this.socket.emit(this.channel, message);
        delete Messages[this.channel];
    }
};

/**
 * обработчик нового подключения
 * @param socket
 */
var connect_handler = function(socket)
{
    debug.console('Socket.IO connect');

    /**
     * регистрация в канале
     */
    socket.on('enter', function(channel_name) {
        debug.console('On channel: ' + channel_name);
        Clients.push(new Client(channel_name, socket));
    });
};

// очистка старых собщений и каналов:
setInterval(function() {

    var now = utils.microtime(true);
    for (var channel in Messages) {
        if (now - Messages[channel].time > config.comet_message_ttl) {
            delete Messages[channel];
        }
    }

    for (var i in Clients) {
        if (now - Clients[i].time > config.comet_message_ttl) {
            Clients[i].die();
        }
    }

}, 60000);

// подписка на событие выслать комет собщение в данный канал
events.instance.on('socket/send', function(channel_name, message) {
    var is_sent = false;
    for (var i in Clients) {
        if (Clients[i].channel === channel_name) {
            Clients[i].send(message);
            is_sent = true;
        }
    }

    if (!is_sent) {
        Messages[channel_name] = {
            message : message,
            time : utils.microtime(true)
        };
    }
});

// start socket server:
var init = function()
{
    debug.console('Run Socket.IO server...');

    IO = new Server(config.server);
    IO.on('connect', connect_handler);
};

// подписки на глобальные события
events.instance.on('transports/restart', function() {

    IO = null;
    init();
});

init();