(function (g) {

    function config() {
        var _self = this;

        _self.APP_ID = controllerMappings.appName;
        _self.DB_NAME = _self.APP_ID + '_db';
        _self.DB_TITLE = 'PDF Forms DB';

        _self.RECORD_NAMES = {
            TEMPLATE: function (name) {
                return 'template_' + name;
            }
        };

        _self.RECORD_TYPES = {
            TEMPLATE: 'TEMPLATE'
        };
    }

    g._config = new config();
})(this);