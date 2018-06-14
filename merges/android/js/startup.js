var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        StatusBar.backgroundColorByHexString('#000000');

        i18n.init(function() {
            startProcess();
            initializeSerialBackend();
        });
    },
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

app.initialize();