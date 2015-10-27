'use strict';
/*
 * mqtt-rpc
 * https://github.com/wolfeidau/mqtt-rpc
 *
 * Copyright (c) 2013 Mark Wolfe
 * Licensed under the MIT license.
 */
var mqtt = require('mqtt');
var mqttrouter = require('mqtt-router');
var codecs = require('./codecs.js');

var Server = function (mqttclient) {

  // default to JSON codec
  this.codec = codecs.byName('json');

  this.mqttclient = mqttclient || mqtt.createClient();

  this.router = mqttrouter.wrap(mqttclient);

  var self = this;

  this._handleReq = function (correlationId, prefix, name, err, data) {

    var replyTopic = prefix + '/' + name + '/reply';

    var msg = {err: err, data: data, _correlationId: correlationId};


    self.mqttclient.publish(replyTopic,
      self.codec.encode(msg));
  };

  this._buildRequestHandler = function (prefix, name, cb) {

    return function (topic, message) {

      var msg = self.codec.decode(message);
      var id = msg._correlationId;

      cb.call(null, msg, self._handleReq.bind(null, id, prefix, name));

    };
  };

  this.provide = function (prefix, name, cb) {

    var requestTopic = prefix + '/' + name + '/request';

    self.router
      .subscribe(requestTopic, self._buildRequestHandler(prefix, name, cb));

  };

  this.format = function(format){
    this.codec = codecs.byName(format);
  };

};

module.exports = Server;