(function (g) {
    controllerMappings
            .adminController()
            .path('/pdfForms/(?<template>[^/]*)/$')
            .addPathResolver('template', '_resolveTemplate')
            .enabled(true)
            .defaultView(views.templateView('/theme/apps/pdfForms/managePdfTemplate.html'))
            .addMethod('GET', '_getTemplateJSON', 'asJson')
            .addMethod('GET', '_downloadPdf', 'download')
            .addMethod('POST', '_savePdf')
            .build();

    g._getTemplateJSON = function (page) {
        var temp = page.attributes.template;

        return views.textView(temp.json, 'application/json');
    };

    g._downloadPdf = function (page) {
        var temp = page.attributes.template;

        return views.redirectView('/_hashes/files/' + temp.get('hash') + '.pdf');
    };

    g._savePdf = function (page, params) {
        var temp = page.attributes.template;
        var pdfHash = temp.get('hash');
        var newHash;

        fileManager.parsePDF(pdfHash, function (pdf) {
            pdf.setFields(params);

            newHash = pdf.save();
        });

        if (isNotBlank(newHash)) {
            var json = JSON.parse(temp.json);
            json.hash = newHash;

            json.metadata = g._generatePdfMetadata(newHash);

            temp.update(JSON.stringify(json));

            return page.jsonResult(true, 'Successfully saved');
        }

        return page.jsonResult(false, 'Oh No! Something went wrong!');
    };
})(this);