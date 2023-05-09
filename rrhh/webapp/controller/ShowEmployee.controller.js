sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        function onInit() {

        };

        let ShowEmployee = Controller.extend("rrhh.controller.ShowEmployee", {});

        ShowEmployee.prototype.onInit = onInit;

        return ShowEmployee;        
    });