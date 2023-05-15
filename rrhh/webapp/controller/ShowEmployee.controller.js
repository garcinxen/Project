sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     * @param {typeof sap.m.MessageBox} MessageBox
     * @param {typeof sap.m.MessageToast} MessageToast
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     */
    function (Controller, Filter, FilterOperator, MessageBox, MessageToast, JSONModel) {
        "use strict";

        function onBeforeRendering () {
            this._splitViewEmployees = this.byId("splitViewEmployees");
        };

        function onBack () {
            this._splitViewEmployees.to(this.byId("emptyEmployeeDetailPage"));
            this._splitViewEmployees.to(this.byId("employeeListPage"));            

            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteApp",{});
        };

        function onShowMaster () {
            this._splitViewEmployees.to(this.byId("employeeListPage"));
        };        

        function onSearchEmployee (oEvent) { 
            let filter = [];           
			let search = oEvent.getSource().getValue();

            //Filter by any of the three fields
			if (search && search.length > 0) {                   
				filter.push(new Filter({
                    filters: [
                        new Filter("FirstName", FilterOperator.Contains, search),
                        new Filter("LastName", FilterOperator.Contains, search),
                        new Filter("Dni", FilterOperator.Contains, search),
                      ],
                      and: false
                }));
			};

			let list = this.byId("employeesList");
			let oBinding = list.getBinding("items");
			oBinding.filter(filter);
        };

        function onClickEmployee (oEvent) {
            let employeeDetailPage = this.byId("employeeDetailPage");
            this._splitViewEmployees.to(employeeDetailPage);
            this.employeeId = oEvent.getParameter("listItem").getBindingContext("odataModel").getProperty("EmployeeId");

            employeeDetailPage.bindElement("odataModel>/Users(EmployeeId='"+ this.employeeId + "',SapId='" + this.getOwnerComponent().SapId + "')");
        };

        function onFireEmployee (oEvent) {
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle(); 

            MessageBox.confirm(oResourceBundle.getText("confirmFire"),{
                title : oResourceBundle.getText("confirm"),
                onClose : function (oAction) {
                        if (oAction === "OK") {
                            this.getView().getModel("odataModel").remove("/Users(EmployeeId='" + this.employeeId + "',SapId='" + this.getOwnerComponent().SapId + "')",{
                                success : function(data){
                                    MessageToast.show(oResourceBundle.getText("deleteOK"));
                                    this.byId("employeesList").getBinding("items").refresh();
                                    this._splitViewEmployees.to(this.byId("emptyEmployeeDetailPage"));
                                }.bind(this),
                                error : function(e){
                                    MessageToast.show(oResourceBundle.getText("deleteKO"));
                                }.bind(this)
                            });
                        };
                }.bind(this)
            });
            
        };

        function onShowPromoteDialog (oEvent) {
            if (!this._promoteDialog) {
                this._promoteDialog = sap.ui.xmlfragment("rrhh.fragment.PromoteEmployee", this);
                this.getView().addDependent(this._promoteDialog);
            }
            
            this._promoteDialog.setModel(new JSONModel({}),"promotionDialog");
            this._promoteDialog.open();            
        };
            
        function onClosePromoteDialog(){
                this._promoteDialog.close();
        };

        function onPromoteEmployee (oEvent) {
            //check is some data has been entered
            this.validateData();

            let error = this._promoteDialog.getModel("promotionDialog").getData().errorFields;

            if (!error) {
                let dialogData = this._promoteDialog.getModel("promotionDialog").getData();
                let oResourceBundle = this.getView().getModel("i18n").getResourceBundle(); 

                let body = {
                    Amount : parseFloat(dialogData.Amount).toString(),
                    CreationDate : dialogData.CreationDate,
                    Comments : dialogData.Comments,
                    SapId : this.getOwnerComponent().SapId,
                    EmployeeId : this.employeeId
                };

                this.getView().setBusy(true);
                this.getView().getModel("odataModel").create("/Salaries",body,{
                    success : function(){
                        this.getView().setBusy(false);
                        MessageToast.show(oResourceBundle.getText("promotionOK"));
                        this.getView().getModel("odataModel").refresh();
                        this.onClosePromoteDialog();
                    }.bind(this),
                    error : function(){
                        this.getView().setBusy(false);
                        MessageToast.show(oResourceBundle.getText("promotionKO"));
                    }.bind(this)
                });
            };
        };

        function validateData () {
            let model = this._promoteDialog.getModel("promotionDialog");
            let modelData = model.getData();

            model.setProperty("/errorFields",false);

            if (!modelData.Amount) {
                model.setProperty("/AmountState","Error");
                modelData.errorFields = true;
            } else {
                if (isNaN(modelData.Amount)) {
                    model.setProperty("/AmountState","Error");
                    modelData.errorFields = true;
                } else {
                    model.setProperty("/AmountState","None");
                };                
            };
            
            if (!modelData.CreationDate) { 
                model.setProperty("/CreationDateState","Error");
                modelData.errorFields = true;
            } else {
                model.setProperty("/CreationDateState","None");
            };
        };

        function onDownloadFile (oEvent) {
            let uploadSet = this.byId("uploadSet");
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            let aItems = uploadSet.getSelectedItems();

            if (aItems.length === 0) {
                MessageBox.error(oResourceBundle.getText("selectFile"));
            } else {
                aItems.forEach((oItem)=>{
                    let sPath = oItem.getBindingContext("odataModel").getPath();
                    window.open("/rrhh/sap/opu/odata/sap/ZEMPLOYEES_SRV" + sPath + "/$value");
                });
            };
        };

        function onDeleteFile (oEvent) {
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            let sPath = oEvent.getParameter("item").getBindingContext("odataModel").getPath();

            this.getView().getModel("odataModel").remove(sPath, {
                success: function(){
                    oEvent.getSource().getBinding("items").refresh();
                },
                error: function(){
                    MessageToast.show(oResourceBundle.getText("deleteFileKO"));
                }
            });
        };

        function onUploadComplete (oEvent) {
            var uploadSet = oEvent.getSource();
            uploadSet.getBinding("items").refresh();
            uploadSet.removeAllHeaderFields();
        };

        function onBeforeUploadStart (oEvent) {
            let uploadSet = oEvent.getSource();
            let fileName = oEvent.getParameter("item").getFileName();

            //SLUG
            let oCustomerHeaderSlug = new sap.ui.core.Item({
                key: "Slug",
                text: this.getOwnerComponent().SapId + ";" + this.employeeId + ";" + fileName
            });    
            
            //CSRF token
            let oCustomerHeaderToken = new sap.ui.core.Item({
                key: "X-CSRF-Token",
                text: this.getView().getModel("odataModel").getSecurityToken()
            });
            
            uploadSet.addHeaderField(oCustomerHeaderSlug);
            uploadSet.addHeaderField(oCustomerHeaderToken); 
        };

        let ShowEmployee = Controller.extend("rrhh.controller.ShowEmployee", {});

        ShowEmployee.prototype.onBeforeRendering = onBeforeRendering;
        ShowEmployee.prototype.onBack = onBack;
        ShowEmployee.prototype.onShowMaster = onShowMaster;
        ShowEmployee.prototype.onSearchEmployee = onSearchEmployee;
        ShowEmployee.prototype.onClickEmployee = onClickEmployee;
        ShowEmployee.prototype.onFireEmployee = onFireEmployee;
        ShowEmployee.prototype.onShowPromoteDialog = onShowPromoteDialog;
        ShowEmployee.prototype.onClosePromoteDialog = onClosePromoteDialog;
        ShowEmployee.prototype.onPromoteEmployee = onPromoteEmployee;
        ShowEmployee.prototype.validateData = validateData;
        ShowEmployee.prototype.onDownloadFile = onDownloadFile;
        ShowEmployee.prototype.onDeleteFile = onDeleteFile;
        ShowEmployee.prototype.onUploadComplete = onUploadComplete;
        ShowEmployee.prototype.onBeforeUploadStart = onBeforeUploadStart;
    
        return ShowEmployee;        
    });