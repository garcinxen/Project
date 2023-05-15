sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.m.MessageBox} MessageBox
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     */
    function (Controller, MessageBox, JSONModel) {
        "use strict";

        //Function to refresh the wizard and set it in the first step.
        function onBeforeRendering(){
            this._wizard = this.byId("wizardCreateEmployee");
            this._navContainer = this.byId("navContainerCreateEmployee");

            let firstStep = this._wizard.getSteps()[0];
            this._wizard.discardProgress(firstStep);
            this._wizard.goToStep(firstStep);
            firstStep.setValidated(false);

            this._model = new JSONModel({});
            this.getView().setModel(this._model);
        }

        function onCancelCreateEmployee(){
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            MessageBox.confirm(oResourceBundle.getText("confirmCancel"),{
                onClose : function (oAction) {
                    if (oAction === "OK") {
                        //return to wizard page in case to cancel in review page
                        this._navContainer.backToPage(this.byId("wizardPage"));
                        this.clearUI();

                        let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("RouteApp",{});
                    };
                }.bind(this)
            });
            
        };

        function onGoToStepTwo(oEvent){
            let salary, type;
            let stepOne = this.byId("stepTypeEmployee");
            let stepTwo = this.byId("stepDataEmployee");
            let buttonPressed = oEvent.getSource();
            let buttonPressedId = this.getView().getLocalId(buttonPressed.getId());
            let slider = this.byId("salarySlider");

            //Clean model for the cases the button pressed change
            this._model.setData(null);

            switch(buttonPressedId){
                case "internBtn":
                    salary = 24000;
                    type = "0";
                    slider.setMin(12000);
                    slider.setMax(80000);
                    slider.setStep(1000);

                    this.byId("autonomousBtn").setPressed(false);
                    this.byId("managerBtn").setPressed(false);
                    break;

                case "autonomousBtn":
                    salary = 400;
                    type = "1";
                    slider.setMin(100);
                    slider.setMax(2000);
                    slider.setStep(100);

                    this.byId("internBtn").setPressed(false);
                    this.byId("managerBtn").setPressed(false);
                    break;

                case "managerBtn":
                    salary = 70000;
                    type = "2";
                    slider.setMin(50000);
                    slider.setMax(200000);
                    slider.setStep(1000);

                    this.byId("autonomousBtn").setPressed(false);
                    this.byId("internBtn").setPressed(false);
                    break;

                default:
                    break;
            };
            
            //Set into model the data according to type of employee selected
            this._model.setData({
                _Type : type,
                _Salary : salary
            });

            if(this._wizard.getCurrentStep() === stepOne.getId()){
                this._wizard.validateStep(this.byId("stepTypeEmployee"));
                this._wizard.nextStep();
            }else{
                this._wizard.goToStep(stepTwo);
            };
        };

        function validateData(oEvent){
            let employeeData = this._model.getData();
            let error = false;

            if (!employeeData._Name) {
                error = true;
                employeeData._NameState = "Error";
            } else {
                employeeData._NameState = "None";
            };

            if (!employeeData._LastName) {
                error = true;
                employeeData._LastNameState = "Error";
            } else {
                employeeData._LastNameState = "None";
            };

            if (!employeeData._DNICIF) { 
                error = true;
                employeeData._DNICIFState = "Error";
            } else {
                if (employeeData._Type !== "1") {
                    error = this.validateDNI();
                } else {
                    employeeData._DNICIFState = "None";
                };                 
            };

            if (!employeeData._IncorporationDate) {
                error = true;
                employeeData._IncorporationDateState = "Error";
            } else {
                employeeData._IncorporationDateState = "None";
            };

            if (error) {
                this._wizard.invalidateStep(this.byId("stepDataEmployee"));
                this._wizard.invalidateStep(this.byId("stepAdditionalInfoEmployee"));            
            } else {
                this._wizard.validateStep(this.byId("stepDataEmployee"));
                this._wizard.validateStep(this.byId("stepAdditionalInfoEmployee"));  
            };
        };

        function validateDNI () {
            let error = false;

            if (this._model.getData()._Type !== "1") {
                let employeeDNI = this._model.getData()._DNICIF;
                let number, letter, letterList;
                let regularExp = /^\d{8}[a-zA-Z]$/;

                if (regularExp.test (employeeDNI) === true) {
                    number = employeeDNI.substr(0,employeeDNI.length-1);
                    letter = employeeDNI.substr(employeeDNI.length-1,1);
                    number = number % 23;
                    letterList="TRWAGMYFPDXBNJZSQVHLCKET";
                    letterList=letterList.substring(number,number+1);

                    if (letterList !== letter.toUpperCase()) {
                        this._model.setProperty("/_DNICIFState","Error");
                        error = true;
                    } else {
                        this._model.setProperty("/_DNICIFState","None");
                    };

                }else{
                    this._model.setProperty("/_DNICIFState","Error");
                    error = true;
                };
            }

            return error;
        };      

        function onCompleteWizard () {
            this._navContainer.to(this.byId("reviewDataPage"));
            let uploadSet = this.byId("uploadSet");
            let files = uploadSet.getIncompleteItems();
			let numFiles = files.length;
            let filesArray = [];

            this._model.setProperty("/_NumFiles", numFiles);

            if (numFiles > 0) {
                for (let i in files) {
                    filesArray.push({
                        fileName: files[i].getFileName(),
                        mediaType: files[i].getMediaType()
                    });	
                };

                this._model.setProperty("/_Files", filesArray);
            } else {
                this._model.setProperty("/_Files", []);
            };
        };

        function onBeforeUploadStart (oEvent) {
            let uploadSet = oEvent.getSource();
            let fileName = oEvent.getParameter("item").getFileName();

            //SLUG
            let oCustomerHeaderSlug = new sap.ui.core.Item({
                key: "Slug",
                text: this.getOwnerComponent().SapId + ";" + this._model.getData()._EmployeeID + ";" + fileName
            });

            //CSRF token
            let oCustomerHeaderToken = new sap.ui.core.Item({
                key: "X-CSRF-Token",
                text: this.getView().getModel("odataModel").getSecurityToken()
            });

            uploadSet.addHeaderField(oCustomerHeaderToken); 
            uploadSet.addHeaderField(oCustomerHeaderSlug);     
        };

        function editStep (step) {            
            let onAfterNavigate = function () {
				this._wizard.goToStep(this._wizard.getSteps()[step]);
                //unassing the function after execute it
				this._navContainer.detachAfterNavigate(onAfterNavigate);
			}.bind(this);

            //assign a function after navigate
			this._navContainer.attachAfterNavigate(onAfterNavigate);
			//return to wizard page in case to cancel in review page
            this._navContainer.backToPage(this.byId("wizardPage"));
        };

        function editStepOne (oEvent) {
            this.editStep(0);
        };

        function editStepTwo (oEvent) {
            this.editStep(1);
        };

        function editStepThree (oEvent) {
            this.editStep(2);
        };

        function onSaveEmployee () {            
            let dataModel = this._model.getData();            
            let body = {
                Type: dataModel._Type,
                SapId: this.getOwnerComponent().SapId,
                FirstName: dataModel._Name,
                LastName: dataModel._LastName,
                Dni: dataModel._DNICIF,
                CreationDate: dataModel._IncorporationDate,
                Comments: dataModel._Comments,
                UserToSalary: [{
                    Amount : parseFloat(dataModel._Salary).toString(),
                    Comments : dataModel._Comments,
                    Waers : "EUR"
                }]
            };

            this.getView().setBusy(true);
            this.getView().getModel("odataModel").create("/Users",body,{
                success : function (data) {                    
                    //Store the id of the employee created in the model
                    this.getNewEmployeeID();                                      
                }.bind(this),
                error : function () {
                    this.getView().setBusy(false);
                }.bind(this)
            });
        };

        function uploadFiles () {
            let uploadSet = this.byId("uploadSet");
            let incompleteItems = uploadSet.getIncompleteItems();
            let items = incompleteItems.length;
            //Counter to manage when all files are uploaded
            this._model.setProperty("/_Counter",0);

            if (items !== 0) {
                uploadSet.setBusy(true);
                for (let i = 0; i < items; i++) {                    
                    uploadSet.uploadItem(incompleteItems[i]);
                    uploadSet.removeAllHeaderFields();
                };
            } else {
                this.getView().setBusy(false);
                this.showMessageEmployeeCreated();                
            };
        };

        function onUploadCompleted () {
            let dataModel = this._model.getData();                       
            dataModel._Counter += 1;
            
            if (dataModel._Counter === dataModel._NumFiles) {                
                this.byId("uploadSet").setBusy(false);  
                this.getView().setBusy(false);
                this.showMessageEmployeeCreated();                              
            };
        };

        function clearUI () {            
            //clean the wizard
            let firstStep = this._wizard.getSteps()[0];
            let secondStep = this._wizard.getSteps()[1];
            let thirdStep = this._wizard.getSteps()[2];
            this._wizard.discardProgress(firstStep);
            this._wizard.goToStep(firstStep);
            firstStep.setValidated(false);
            secondStep.setValidated(false);
            thirdStep.setValidated(false);

            //clear buttons state
            this.byId("internBtn").setPressed(false);
            this.byId("autonomousBtn").setPressed(false);
            this.byId("managerBtn").setPressed(false);

            //clear the model
            this._model.setData(null);
            
            //Clear the UploadSet
            this.byId("uploadSet").removeAllIncompleteItems();
            this.byId("uploadSet").removeAllItems();
        };

        function getNewEmployeeID () {    
            this.getView().getModel("odataModel").read("/Users",{
                filters: [
                    new sap.ui.model.Filter("SapId", "EQ", this.getOwnerComponent().SapId)
                ],
                success : function (data) {
                    let usersLength = data.results.length;
                    let employeeId = data.results[usersLength - 1].EmployeeId;

                    this._model.setProperty("/_EmployeeID",employeeId);

                    //Load files in server
                    this.uploadFiles();                  
                    
                }.bind(this),
                error : function () {
                    this._model.setProperty("/_EmployeeID",0);
                    this.getView().setBusy(false);
                }.bind(this)
            });
        };

        function showMessageEmployeeCreated () { 
            let dataModel = this._model.getData();
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle(); 

            MessageBox.information(oResourceBundle.getText("createdEmployee") + ": " + dataModel._EmployeeID,{
                onClose : function(){  
                    this._navContainer.backToPage(this.byId("wizardPage"));                     
                    this.clearUI();    

                    let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteApp",{});
                }.bind(this)
            });
        };

        let CreateEmployee = Controller.extend("rrhh.controller.CreateEmployee", {});

        CreateEmployee.prototype.onBeforeRendering = onBeforeRendering;
        CreateEmployee.prototype.onCancelCreateEmployee = onCancelCreateEmployee;
        CreateEmployee.prototype.onGoToStepTwo = onGoToStepTwo;
        CreateEmployee.prototype.validateData = validateData;
        CreateEmployee.prototype.validateDNI = validateDNI;        
        CreateEmployee.prototype.onCompleteWizard = onCompleteWizard;
        CreateEmployee.prototype.onBeforeUploadStart = onBeforeUploadStart;
        CreateEmployee.prototype.editStep = editStep;
        CreateEmployee.prototype.editStepOne = editStepOne;
        CreateEmployee.prototype.editStepTwo = editStepTwo;
        CreateEmployee.prototype.editStepThree = editStepThree;
        CreateEmployee.prototype.onSaveEmployee = onSaveEmployee;
        CreateEmployee.prototype.uploadFiles = uploadFiles;
        CreateEmployee.prototype.onUploadCompleted = onUploadCompleted;
        CreateEmployee.prototype.clearUI = clearUI;
        CreateEmployee.prototype.getNewEmployeeID = getNewEmployeeID;
        CreateEmployee.prototype.showMessageEmployeeCreated = showMessageEmployeeCreated;

        return CreateEmployee;        
    });