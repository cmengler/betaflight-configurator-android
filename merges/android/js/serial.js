'use strict';

var serialConnection = {
    connected:       false,
    connectionId:    false,
    openRequested:   false,
    openCanceled:    false,
    bitrate:         0,
    bytesReceived:   0,
    bytesSent:       0,
    failed:          0,
    connectionType:  'serial', // 'serial' or 'tcp'
    connectionIP:    '127.0.0.1',
    connectionPort:  2323,

    transmitting:   false,
    outputBuffer:  [],

    logHead: 'SERIAL: ',

    requestPermissions: function(success, error) {
        serial.requestPermission({}, success, function(message) {
            // Fallback to default serial ports
            serial.requestPermission(success, error);
        });
    },
    connect: function (path, options, callback) {
        var self = this;
        var testUrl = path.match(/^tcp:\/\/([A-Za-z0-9\.-]+)(?:\:(\d+))?$/)
        if (testUrl) {
            self.connectTcp(testUrl[1], testUrl[2], options, callback);
        } else {
            self.connectSerial(path, options, callback);
        }
    },
    connectSerial: function (path, options, callback) {
        var self = this;
        self.openRequested = true;
        self.connectionType = 'serial';
        self.logHead = 'SERIAL: ';

        var serialOptions = {
            baudRate: options.bitrate,
            sleepOnPause: true
        }

        var connectionInfo = {
            connectionId: 1,
            bitrate: serialOptions.baudRate
        }

        self.requestPermissions(
            function success(message) {
                serial.open(serialOptions,
                    function success(message) {
                        if (connectionInfo && !self.openCanceled) {
                            self.connected = true;
                            self.connectionId = connectionInfo.connectionId;
                            self.bitrate = connectionInfo.bitrate;
                            self.bytesReceived = 0;
                            self.bytesSent = 0;
                            self.failed = 0;
                            self.openRequested = false;

                            self.onReceive.addListener(function log_bytesReceived(info) {
                                self.bytesReceived += info.data.byteLength;
                            });

                            self.onReceiveError.addListener(function watch_for_on_receive_errors(info) {
                                console.error(info);
                            });

                            serial.registerReadCallback(
                                function success(data) {
                                    var info = {
                                        connectionId: self.connectionId,
                                        data: data
                                    };
                                    self.onReceive.receiveData(info);
                                },
                                function error() {
                                    new Error("Failed to register read callback");
                                }
                            );

                            console.log('SERIAL: Connection opened with ID: ' + connectionInfo.connectionId + ', Baud: ' + connectionInfo.bitrate);

                            if (callback) callback(connectionInfo);
                        } else if (connectionInfo && self.openCanceled) {
                            // connection opened, but this connect sequence was canceled
                            // we will disconnect without triggering any callbacks
                            self.connectionId = connectionInfo.connectionId;
                            console.log('SERIAL: Connection opened with ID: ' + connectionInfo.connectionId + ', but request was canceled, disconnecting');

                            // some bluetooth dongles/dongle drivers really doesn't like to be closed instantly, adding a small delay
                            setTimeout(function initialization() {
                                self.openRequested = false;
                                self.openCanceled = false;
                                self.disconnect(function resetUI() {
                                    if (callback) callback(false);
                                });
                            }, 150);
                        } else if (self.openCanceled) {
                            // connection didn't open and sequence was canceled, so we will do nothing
                            console.log('SERIAL: Connection didn\'t open and request was canceled');
                            self.openRequested = false;
                            self.openCanceled = false;
                            if (callback) callback(false);
                        } else {
                            self.openRequested = false;
                            console.log('SERIAL: Failed to open serial port');
                            if (callback) callback(false);
                        }
                    },
                    function error(message) {
                        console.log("Error: " + message);
                        if (request.canceled) {
                            // connection didn't open and sequence was canceled, so we will do nothing
                            console.log('SERIAL: Connection didn\'t open and request was canceled');
                            // TODO maybe we should do something?
                        } else {
                            // connection didn't open and request was not canceled
                            console.log('SERIAL: Failed to open serial port');
                            if (request.callback) request.callback(false);
                        }
                    }
                );
            },
            function error(message) {
                alert(message);
            }
        );
    },
    connectTcp: function (ip, port, options, callback) {
        var self = this;
        self.openRequested = true;
        self.connectionIP = ip;
        self.connectionPort = port || 2323;
        self.connectionPort = parseInt(self.connectionPort);
        self.connectionType = 'tcp';
        self.logHead = 'SERIAL-TCP: ';

        console.log('connect to raw tcp:', ip + ':' + port)
        chrome.sockets.tcp.create({}, function(createInfo) {
            console.log('chrome.sockets.tcp.create', createInfo)
            if (createInfo && !self.openCanceled) {
                self.connectionId = createInfo.socketId;
                self.bitrate = 115200; // fake
                self.bytesReceived = 0;
                self.bytesSent = 0;
                self.failed = 0;
                self.openRequested = false;
            }

            chrome.sockets.tcp.connect(createInfo.socketId, self.connectionIP, self.connectionPort, function (result){
                if (chrome.runtime.lastError) {
                    console.error('onConnectedCallback', chrome.runtime.lastError.message);
                }

                console.log('onConnectedCallback', result)
                if(result == 0) {
                    self.connected = true;
                    chrome.sockets.tcp.setNoDelay(createInfo.socketId, true, function (noDelayResult){
                        if (chrome.runtime.lastError) {
                            console.error('setNoDelay', chrome.runtime.lastError.message);
                        }

                        console.log('setNoDelay', noDelayResult)
                        if(noDelayResult != 0) {
                            self.openRequested = false;
                            console.log(self.logHead + 'Failed to setNoDelay');
                        }
                        self.onReceive.addListener(function log_bytesReceived(info) {
                            if (info.socketId != self.connectionId) return;
                            self.bytesReceived += info.data.byteLength;
                        });
                        self.onReceiveError.addListener(function watch_for_on_receive_errors(info) {
                            console.error(info);
                            if (info.socketId != self.connectionId) return;

                            // TODO: better error handle
                            // error code: https://cs.chromium.org/chromium/src/net/base/net_error_list.h?sq=package:chromium&l=124
                            switch (info.resultCode) {
                                case -100: // CONNECTION_CLOSED
                                case -102: // CONNECTION_REFUSED
                                    if (GUI.connected_to || GUI.connecting_to) {
                                        $('a.connect').click();
                                    } else {
                                        self.disconnect();
                                    }
                                    break;

                            }
                        });

                        console.log(self.logHead + 'Connection opened with ID: ' + createInfo.socketId + ', url: ' + self.connectionIP + ':' + self.connectionPort);
                        if (callback) callback(createInfo);
                    });
                } else {
                    self.openRequested = false;
                    console.log(self.logHead + 'Failed to connect');
                    if (callback) callback(false);
                }

            });
        });
    },
    disconnect: function (callback) {
        var self = this;
        self.connected = false;

        if (self.connectionId) {
            self.emptyOutputBuffer();

            // remove listeners
            for (var i = (self.onReceive.listeners.length - 1); i >= 0; i--) {
                self.onReceive.removeListener(self.onReceive.listeners[i]);
            }

            for (var i = (self.onReceiveError.listeners.length - 1); i >= 0; i--) {
                self.onReceiveError.removeListener(self.onReceiveError.listeners[i]);
            }

            if (self.connectionType == 'serial') {
                serial.close(
                    function success(message) {
                        console.log('SERIAL: Connection with ID: ' + self.connectionId + ' closed, Sent: ' + self.bytesSent + ' bytes, Received: ' + self.bytesReceived + ' bytes');
                        self.connectionId = false;
                        self.bitrate = 0;
                        if (callback) callback(true);
                    },
                    function error(message) {
                        console.log('SERIAL: Failed to close connection with ID: ' + self.connectionId + ' closed, Sent: ' + self.bytesSent + ' bytes, Received: ' + self.bytesReceived + ' bytes');
                        self.connectionId = false;
                        self.bitrate = 0;
                        if (callback) callback(false);
                    }
                );
            } else {
                chrome.sockets.tcp.close(this.connectionId, function (result) {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                    }

                    result = result || self.connectionType == 'tcp'
                    if (result) {
                        console.log(self.logHead + 'Connection with ID: ' + self.connectionId + ' closed, Sent: ' + self.bytesSent + ' bytes, Received: ' + self.bytesReceived + ' bytes');
                    } else {
                        console.log(self.logHead + 'Failed to close connection with ID: ' + self.connectionId + ' closed, Sent: ' + self.bytesSent + ' bytes, Received: ' + self.bytesReceived + ' bytes');
                    }

                    self.connectionId = false;
                    self.bitrate = 0;

                    if (callback) callback(result);
                });
            }

        } else {
            // connection wasn't opened, so we won't try to close anything
            // instead we will rise canceled flag which will prevent connect from continueing further after being canceled
            self.openCanceled = true;
        }
    },
    getDevices: function (callback) {
        var devices = [];
        devices.push("USB OTG");
        callback(devices);
    },
    getInfo: function (callback) {
        if (serialConnection.connectionType == 'tcp') {
            chrome.sockets.tcp.getInfo(this.connectionId, callback);
        } else {
            if (callback) callback({});
        }
    },
    getControlSignals: function (callback) {
        if (callback) callback({});
    },
    setControlSignals: function (signals, callback) {
        if (callback) callback({});
    },
    send: function (data, callback) {
        var self = this;
        this.outputBuffer.push({'data': data, 'callback': callback});

        function send() {
            // store inside separate variables in case array gets destroyed
            var data = self.outputBuffer[0].data,
                callback = self.outputBuffer[0].callback;

            if (!self.connected) {
                console.log('attempting to send when disconnected');
                if (callback) callback({
                    bytesSent: 0,
                    error: 'undefined'
               });
               return;
            }

            if (self.connectionType == 'serial') {
                var buf = self.ab2string(data);
                serial.writeHex(buf, function success(message) {
                    // track sent bytes for statistics
                    var sendInfo = {
                            bytesSent: buf.length >> 1
                        } // Needed only for stats
                    console.log(sendInfo.bytesSent + " has been sent");
                    self.bytesSent += sendInfo.bytesSent;
                    // fire callback
                    if (callback) callback(sendInfo);

                    // remove data for current transmission form the buffer
                    self.outputBuffer.shift();

                    // if there is any data in the queue fire send immediately, otherwise stop trasmitting
                    if (self.outputBuffer.length) {
                        // keep the buffer withing reasonable limits
                        if (self.outputBuffer.length > 100) {
                            var counter = 0;

                            while (self.outputBuffer.length > 100) {
                                self.outputBuffer.pop();
                                counter++;
                            }

                            console.log('SERIAL: Send buffer overflowing, dropped: ' + counter + ' entries');
                        }

                        send();
                    } else {
                        self.transmitting = false;
                    }
                }, function error(message) {
                    console.log("Error: " + message);
                });
            } else {
                chrome.sockets.tcp.send(self.connectionId, data, function (sendInfo) {
                    if (sendInfo === undefined) {
                        console.log('undefined send error');
                        if (callback) callback({
                            bytesSent: 0,
                            error: 'undefined'
                    });
                    return;
                    }

                    // tcp send error
                    if (self.connectionType == 'tcp' && sendInfo.resultCode < 0) {
                        var error = 'system_error';

                        // TODO: better error handle
                        // error code: https://cs.chromium.org/chromium/src/net/base/net_error_list.h?sq=package:chromium&l=124
                        switch (sendInfo.resultCode) {
                            case -100: // CONNECTION_CLOSED
                            case -102: // CONNECTION_REFUSED
                                error = 'disconnected';
                                break;

                        }
                        if (callback) callback({
                            bytesSent: 0,
                            error: error
                        });
                        return;
                    }

                    // track sent bytes for statistics
                    self.bytesSent += sendInfo.bytesSent;

                    // fire callback
                    if (callback) callback(sendInfo);

                    // remove data for current transmission form the buffer
                    self.outputBuffer.shift();

                    // if there is any data in the queue fire send immediately, otherwise stop trasmitting
                    if (self.outputBuffer.length) {
                        // keep the buffer withing reasonable limits
                        if (self.outputBuffer.length > 100) {
                            var counter = 0;

                            while (self.outputBuffer.length > 100) {
                                self.outputBuffer.pop();
                                counter++;
                            }

                            console.log(self.logHead + 'Send buffer overflowing, dropped: ' + counter + ' entries');
                        }

                        send();
                    } else {
                        self.transmitting = false;
                    }
                });
            }
        }

        if (!this.transmitting) {
            this.transmitting = true;
            send();
        }
    },
    onReceive: {
        listeners: [],

        addListener: function (function_reference) {
            if (serialConnection.connectionType == 'tcp') {
                chrome.sockets.tcp.onReceive.addListener(function_reference);
            }
            this.listeners.push(function_reference);
        },
        removeListener: function (function_reference) {
            for (var i = (this.listeners.length - 1); i >= 0; i--) {
                if (this.listeners[i] == function_reference) {
                    if (serialConnection.connectionType == 'tcp') {
                        chrome.sockets.tcp.onReceive.removeListener(function_reference);
                    }

                    this.listeners.splice(i, 1);
                    break;
                }
            }
        },
        receiveData: function(info) {
            if (info.data.byteLength > 0) {
                for (var i = (this.listeners.length - 1); i >= 0; i--) {
                    this.listeners[i](info);
                }
            }
        }
    },
    onReceiveError: {
        listeners: [],

        addListener: function (function_reference) {
            if (serialConnection.connectionType == 'tcp') {
                chrome.sockets.tcp.onReceiveError.addListener(function_reference);
            }
            this.listeners.push(function_reference);
        },
        removeListener: function (function_reference) {
            for (var i = (this.listeners.length - 1); i >= 0; i--) {
                if (this.listeners[i] == function_reference) {
                    if (serialConnection.connectionType == 'tcp') {
                        chrome.sockets.tcp.onReceiveError.removeListener(function_reference);
                    }

                    this.listeners.splice(i, 1);
                    break;
                }
            }
        },
        receiveError: function(data) {
            for (var i = (this.listeners.length - 1); i >= 0; i--) {
                this.listeners[i](data);
            }
        }
    },
    emptyOutputBuffer: function () {
        this.outputBuffer = [];
        this.transmitting = false;
    },
    ab2string: function(arr) {
        var ua = new Uint8Array(arr);
        var h = '';
        for (var i = 0; i < ua.length; i++) {
            var s = ua[i].toString(16);
            if (s.length == 1) s = '0' + s;
            h += s;
        }
        return h;
    }
};
