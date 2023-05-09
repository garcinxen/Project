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

        function onInit() {
        };

        //Function to refresh the wizard and set it in the first step.
        function onBeforeRendering(){
            this._wizard = this.byId("wizardCreateEmployee");

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
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
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

            switch(buttonPressedId){
                case "internBtn":
                    salary = 24000;
                    type = "0";
                    slider.setMin(12000);
                    slider.setMax(80000);
                    slider.setStep(1000);
                    break;

                case "autonomousBtn":
                    salary = 400;
                    type = "1";
                    slider.setMin(100);
                    slider.setMax(2000);
                    slider.setStep(100);
                    break;

                case "managerBtn":
                    salary = 70000;
                    type = "2";
                    slider.setMin(50000);
                    slider.setMax(200000);
                    slider.setStep(1000);
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

        function validateData(){
            let employeeData = this._model.getData();
            let error = false;
            let nextBtn = this.byId("nextStepBtn");

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

            if (employeeData._Type === "1") { 
                if (!employeeData._CIF) {
                    error = true;
                    employeeData._CIFState = "Error";
                } else { 
                    employeeData._CIFState = "None";
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
                nextBtn.setVisible(false);  
                nextBtn.setEnabled(false);              
            } else {
                this._wizard.validateStep(this.byId("stepDataEmployee"));
                nextBtn.setVisible(true);  
                nextBtn.setEnabled(true);  
            };
        };

        function validateDNI (oEvent) {
            let employeeDNI = oEvent.getParameter("value");
            let number, letter, letterList;
            let regularExp = /^\d{8}[a-zA-Z]$/;

            if (regularExp.test (employeeDNI) === true) {
                number = employeeDNI.substr(0,employeeDNI.length-1);
                letter = employeeDNI.substr(employeeDNI.length-1,1);
                number = number % 23;
                letterList="TRWAGMYFPDXBNJZSQVHLCKET";
                letterList=letterList.substring(number,number+1);

                if (letterList !== letter.toUpperCase()) {
                    this._model.setProperty("/_DNIState","Error");
                } else {
                    this._model.setProperty("/_DNIState","None");
                };

            }else{
                this._model.setProperty("/_DNIState","Error");
            };
        };

        function onGoToStepThree(oEvent){
            let stepTwo = this.byId("stepDataEmployee");
            let stepThree = this.byId("stepAdditionalInfoEmployee");

            if(this._wizard.getCurrentStep() === stepTwo.getId()){
                this._wizard.nextStep();
            }else{
                this._wizard.goToStep(stepThree);
            };
        };

        let CreateEmployee = Controller.extend("rrhh.controller.CreateEmployee", {});

        CreateEmployee.prototype.onBeforeRendering = onBeforeRendering;
        CreateEmployee.prototype.onInit = onInit;
        CreateEmployee.prototype.onCancelCreateEmployee = onCancelCreateEmployee;
        CreateEmployee.prototype.onGoToStepTwo = onGoToStepTwo;
        CreateEmployee.prototype.validateData = validateData;
        CreateEmployee.prototype.validateDNI = validateDNI;
        CreateEmployee.prototype.onGoToStepThree = onGoToStepThree;

        return CreateEmployee;        
    });