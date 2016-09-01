(function (w, $) {
    function initCreateTemplate() {
        var modal = $('#modal-add-template');
        var modalForm = modal.find('form');

        modalForm.forms({
            onSuccess: function (resp) {
                Msg.success(resp.messages);
                modal.modal('hide');
                modalForm.trigger('reset');
            }
        });
    }


    $(function () {
        initCreateTemplate();
    });

})(window, jQuery);