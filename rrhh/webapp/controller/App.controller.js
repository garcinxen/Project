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

        function onAfterRendering(){
            // Error en el framework : Al agregar la dirección URL de "Firmar pedidos", el componente GenericTile debería navegar directamente a dicha URL,
            // pero no funciona en la version 1.78. Por tanto, una solución encontrada es eliminando la propiedad id del componente por jquery
            let genericTileFirmarPedido = this.byId("tileSignOrder");

            //Id del dom
            let idGenericTileFirmarPedido = genericTileFirmarPedido.getId();

            //Se vacia el id
            jQuery("#" + idGenericTileFirmarPedido)[0].id = "";
        };

        function onCreateEmployee(){
            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteCreateEmployee",{});
        };

        function onShowEmployee(){
            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteShowEmployee",{});
        };

        let App = Controller.extend("rrhh.controller.App", {});

        App.prototype.onInit = onInit;
        App.prototype.onAfterRendering = onAfterRendering;
        App.prototype.onCreateEmployee = onCreateEmployee;
        App.prototype.onShowEmployee = onShowEmployee;

        return App;        
    });