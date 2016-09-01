(function (g) {
    controllerMappings
            .adminController()
            .path('/pdfForms/')
            .enabled(true)
            .defaultView(views.templateView('/theme/apps/pdfForms/managePdfTemplates.html'))
            .addMethod('GET', '_loadTemplates')
            .addMethod('POST', '_addNewTemplate', 'templateTitle')
            .build();

    g._loadTemplates = function (page) {
        var db = _getOrCreateUrlDb(page);

        page.attributes.templates = db.findByType(g._config.RECORD_TYPES.TEMPLATE);
    };

    g._addNewTemplate = function (page, params, files) {
        var db = _getOrCreateUrlDb(page);

        var pdfFile = files.get('pdf');
        var pdfHash = fileManager.uploadFile(pdfFile);
        var meta = g._generatePdfMetadata(pdfHash);

        var templateTitle = safeString(params.templateTitle);
        var templateName = replaceYuckyChars(templateTitle);

        var count = 1;
        var newName = templateName;
        while (isNotNull(db.child(g._config.RECORD_NAMES.TEMPLATE(newName)))) {
            newName = templateName + '-' + count;
            count++;
        }

        var d = {
            name: newName,
            title: templateTitle,
            hash: pdfHash,
            metadata: meta
        };

        db.createNew(g._config.RECORD_NAMES.TEMPLATE(newName), JSON.stringify(d), g._config.RECORD_TYPES.TEMPLATE);
        return page.jsonResult(true, 'Template Successfully added');
    };
})(this);