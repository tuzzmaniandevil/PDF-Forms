(function (g) {
    g._getOrCreateUrlDb = function (page) {
        var jsonDb = page.find('/jsondb');
        var db = jsonDb.child(_config.DB_NAME);

        if (isNull(db)) {
            db = jsonDb.createDb(_config.DB_NAME, _config.DB_TITLE, _config.DB_NAME);

            _updateMappings(db);

            _setAllowAccess(db, true);
        }

        return db;
    };

    g._setAllowAccess = function (jsonDB, allowAccess) {
        transactionManager.runInTransaction(function () {
            jsonDB.setAllowAccess(allowAccess);
        });
    };

    g._checkRedirect = function (page, params) {
        var href = page.href;
        if (!href.endsWith('/')) {
            return views.redirectView(href + '/');
        }
    };

    g._updateMappings = function (db) {
        var b = formatter.newMapBuilder();

        b.field(g._config.RECORD_TYPES.TEMPLATE, JSON.stringify(templateMapping));

        db.updateTypeMappings(b);
    };

    /*==== Resolvers ====*/
    g._resolveTemplate = function (rf, groupName, groupVal) {
        var db = _getOrCreateUrlDb(rf);

        var templ = _config.RECORD_NAMES.TEMPLATE(groupVal);
        return db.child(templ);
    };

    g._generatePdfMetadata = function (hash) {
        var meta = {
            pageCount: 0
        };

        var pageImages = [];

        fileManager.parsePDF(hash, function (pdf) {
            meta.pageCount = pdf.numberOfPages;
            meta.fields = [];
            meta.pages = [];

            var docInfo = pdf.documentInformation;
            if (isNotNull(docInfo)) {
                meta.title = docInfo.title;
                meta.author = docInfo.author;
                meta.subject = docInfo.subject;
                meta.keywords = docInfo.keywords;
                meta.creator = docInfo.creator;
            }

            var imageHashes = fileManager.pdfManager.generatePdfThumbnails(pdf, 150, 'jpg');
            for (var i in imageHashes) {
                pageImages.push(imageHashes[i]);
            }

            var pages = pdf.pages;
            var pagesIt = pages.iterator();
            while (pagesIt.hasNext()) {
                var page = pagesIt.next();
                var pageIndex = pages.indexOf(page)

                var p = {
                    pageIndex: pageIndex,
                    hash: pageImages[pageIndex]
                };

                if (isNotNull(page.mediaBox)) {
                    p.mediaBox = {
                        width: page.mediaBox.width,
                        height: page.mediaBox.height,
                    };
                }

                p.style = '#page-' + pageIndex + ' img{'
                        + 'position: absolute; '
                        + 'width: ' + p.mediaBox.width + 'pt; '
                        + 'height: ' + p.mediaBox.height + 'pt; '
                        + 'bottom: ' + p.mediaBox.lowerLeftY + 'pt; '
                        + 'left: ' + p.mediaBox.lowerLeftX + 'pt; '
                        + '}';

                meta.pages.push(p);
            }

            var fields = pdf.fields;
            for (var i in fields) {
                var field = fields[i];

                var f = {
                    fieldType: fileManager.pdfManager.getFieldType(field),
                    readOnly: field.readOnly,
                    required: field.required,
                    partialName: field.partialName,
                    mappingName: field.mappingName,
                    value: field.valueAsString,
                    html: '',
                    style: '',
                    widgets: []
                };

                if (f.fieldType == "CheckBox") {
                    f.onValue = field.onValue;
                } else if (f.fieldType == 'RadioButton') {
                    f.exportValues = [];
                    var exportValues = field.exportValues;

                    for (var i in exportValues) {
                        var v = exportValues[i];
                        f.exportValues.push(v);
                    }
                }

                var mainWidget = null;

                var widgets = field.widgets;
                for (var w in widgets) {
                    var widget = widgets[w];

                    if ('Widget' === widget.subtype && isNull(mainWidget)) {
                        mainWidget = widget;
                    }

                    var wd = {
                        pageIndex: pages.indexOf(widget.page),
                        width: widget.rectangle.width,
                        height: widget.rectangle.height,
                        subType: widget.subtype,
                        highlightingMode: widget.highlightingMode,
                        contents: widget.contents,
                        annotationName: widget.annotationName
                    };

                    f.widgets.push(wd);
                }
                if (isNotNull(mainWidget)) {
                    f.pageIndex = pages.indexOf(mainWidget.page);

                    switch (f.fieldType) {
                        case "CheckBox":
                            {
                                var id = replaceYuckyChars(f.partialName);
                                var checked = (f.onValue == f.value ? 'checked="checked"' : '');
                                var disabled = (f.onValue == f.value ? 'disabled="disabled"' : '');
                                var chkb = '<input value="' + f.onValue + '" type="checkbox" name="' + f.partialName + '" id="' + id + '" ' + checked + '/>\n'
                                        + '<input value="Off" type="hidden" name="' + f.partialName + '" id="off_' + id + '" ' + disabled + '/>';
                                f.html = chkb;

                                var chkbStyle = '#' + id + '{'
                                        + 'position: absolute; '
                                        + 'width: ' + mainWidget.rectangle.width + 'pt; '
                                        + 'height: ' + mainWidget.rectangle.height + 'pt; '
                                        + 'bottom: ' + mainWidget.rectangle.lowerLeftY + 'pt; '
                                        + 'left: ' + mainWidget.rectangle.lowerLeftX + 'pt; '
                                        + '}';
                                f.style = chkbStyle;
                            }
                            break;
                        case "TextField":
                            {
                                f.html = "";
                                f.style = "";
                            }
                            break;
                        case "ComboBox":
                            {
                                f.html = "";
                                f.style = "";
                            }
                            break;
                        default:
                            f.html = "";
                            f.style = "";
                    }
                }

                meta.fields.push(f);
            }
        });

        return meta;
    };
})(this);

var templateMapping = {
    "properties": {
        "name": {
            "type": "string",
            "index": "not_analyzed"
        },
        "title": {
            "type": "string",
            "index": "not_analyzed"
        },
        "hash": {
            "type": "string",
            "index": "not_analyzed"
        },
        "metadata": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "author": {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "subject": {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "keywords": {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "creator": {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "pageCount": {
                    "type": "long"
                },
                pageImages: {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "fields": {
                    "type": "object",
                    "properties": {
                        "fieldType": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "partialName": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "mappingName": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "value": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "readOnly": {
                            "type": "boolean"
                        },
                        "required": {
                            "type": "boolean"
                        },
                        "widgets": {
                            "type": "object",
                            "properties": {
                                "pageIndex": {
                                    "type": "long"
                                },
                                "width": {
                                    "type": "long"
                                },
                                "height": {
                                    "type": "long"
                                },
                                "subType": {
                                    "type": "string",
                                    "index": "not_analyzed"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};