sap.ui.define(
	[
		"pavel/kliuiko/controller/BaseController",
		"sap/ui/core/Messaging",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"sap/ui/table/Column",
		"sap/m/Label",
		"sap/m/Text",
		"sap/m/Token",
		"sap/ui/core/ValueState",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/EventBus",
	],
	function (
		Controller,
		Messaging,
		MessageBox,
		MessageToast,
		Column,
		Label,
		Text,
		Token,
		ValueState,
		JSONModel,
		EventBus
	) {
		"use strict";

		return Controller.extend("pavel.kliuiko.controller.ProductDetails", {
			/**
			 * Controller's "init" lifecycle method.
			 */
			onInit: function () {
				const oRouter = this.getOwnerComponent().getRouter();
				oRouter
					.getRoute("SupplierDetails")
					.attachPatternMatched(this.onPatternMatched, this);
				this.oDataModel = this.getOwnerComponent().getModel();
				this.appViewModel =
					this.getOwnerComponent().getModel("appViewModel");
				this.stateModel =
					this.getOwnerComponent().getModel("stateModel");
				this.stateModel.setProperty("/editMode", false);
				this.stateModel.setProperty("/displayMode", true);
				this.stateModel.setProperty("/productsDeleteBtn", false);
				this.stateModel.setProperty("/supplierErrValidateBtn", true);
				Messaging.registerObject(this.getView(), true);
				this.getView().setModel(
					Messaging.getMessageModel(),
					"messages"
				);

				this.countriesModel = new JSONModel(
					"localData/countriesInfo.json"
				);
				this.getView().setModel(this.countriesModel, "countriesModel");
				EventBus.getInstance().subscribe(
					"countryChannel",
					"requestCountryDataClick",
					this.handleDataRequest,
					this
				);
			},

			/**
			 * "SupplierDetails" route pattern matched event handler.
			 *
			 * @param {sap.ui.base.Event} oEvent event object.
			 */
			onPatternMatched: function (oEvent) {
				this.sSupplierId = oEvent.getParameter("arguments").SupplierID;
				const sMode = oEvent.getParameter("arguments").Mode;
				Messaging.removeAllMessages();
				let sSupplierPath;
				if (sMode === "Create") {
					sSupplierPath = this._activateCreateMode();
				} else {
					sSupplierPath = this._activateEditOrDisplayMode(sMode);
				}
				this.getView().bindObject({
					path: sSupplierPath,
				});
			},

			/**
			 * "requestCountryDataClick" event handler of event bus subscription.
			 *
			 */
			handleDataRequest: function () {
				console.log(this.countriesModel.getProperty("/countries"));
			},

			/**
			 * Activate create mode for creating a new supplier.
			 *
			 * @returns {string} path for supplier page binding.
			 */
			_activateCreateMode: function () {
				const sSupplierErrorCreatingMsg = this._getI18nText(
					"SupplierErrorCreatingMsg"
				);
				this.stateModel.setProperty("/editMode", false);
				this.stateModel.setProperty("/displayMode", false);
				const oNewSupplierCtx = this.oDataModel.createEntry(
					"/Suppliers",
					{
						properties: {
							ID: this._createNewId(),
							Name: "",
							Address: {
								Street: "",
								City: "",
								State: "",
								ZipCode: "",
								Country: "",
							},
						},
						success: () =>
							this.getOwnerComponent()
								.getRouter()
								.navTo("SuppliersTable"),
						error: () =>
							MessageBox.alert(sSupplierErrorCreatingMsg),
					}
				);
				return oNewSupplierCtx.getPath();
			},

			/**
			 * Activate edit or display mode for editing or displaying a supplier.
			 *
			 * @param {string} sMode opening mode.
			 *
			 * @returns {string} path for supplier page binding.
			 */
			_activateEditOrDisplayMode: function (sMode) {
				this.stateModel.setProperty("/editMode", sMode === "Edit");
				this.stateModel.setProperty(
					"/displayMode",
					sMode === "Display"
				);
				return this.oDataModel.createKey("/Suppliers", {
					ID: this.sSupplierId,
				});
			},

			/**
			 * "Delete" current supplier button press event handler.
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onDeleteCurrentSupplier: function (oEvent) {
				const sWarningTitle = this._getI18nText("WarningTitle");
				const sSupplierName = oEvent
					.getSource()
					.getBindingContext()
					.getObject("Name");
				const sWarningText = this._getI18nText(
					"SupplierDeletingConfirmText",
					sSupplierName
				);
				MessageBox.warning(sWarningText, {
					title: sWarningTitle,
					onClose: function (sAction) {
						if (sAction === "YES") {
							this._deleteCurrentSupplier(oEvent);
						}
					}.bind(this),
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				});
			},

			/**
			 * Delete current supplier.
			 */
			_deleteCurrentSupplier: function (oEvent) {
				const sSupplierErrorDeletingMsg = this._getI18nText(
					"SupplierErrorDeletingMsg"
				);
				const oSupplier = oEvent
					.getSource()
					.getBindingContext("oDataModel")
					.getObject();
				const sSupplierKey = this.oDataModel.createKey(
					"/Suppliers",
					oSupplier
				);
				this.oDataModel.remove(sSupplierKey, {
					success: () =>
						this.getOwnerComponent()
							.getRouter()
							.navTo("SuppliersTable"),
					error: () => MessageBox.error(sSupplierErrorDeletingMsg),
				});
			},

			/**
			 * Activate edit mode.
			 */
			onEditModePress: function () {
				this.getOwnerComponent().getRouter().navTo(
					"SupplierDetails",
					{
						SupplierID: this.sSupplierId,
						Mode: "Edit",
					},
					true
				);
			},

			/**
			 * Cancel supplier changes press event handler.
			 */
			onCancelChangesPress: function () {
				const oCtx = this.getView().getBindingContext("oDataModel");
				if (this.stateModel.getProperty("/editMode")) {
					this.oDataModel.resetChanges();
					this.getOwnerComponent().getRouter().navTo(
						"SupplierDetails",
						{
							SupplierID: this.sSupplierId,
							Mode: "Display",
						},
						true
					);
					this.oDataModel.refresh();
				} else {
					this.oDataModel.deleteCreatedEntry(oCtx);
					this.getOwnerComponent()
						.getRouter()
						.navTo("SuppliersTable");
				}
				Messaging.removeAllMessages();
			},

			/**
			 * "valueHelpRequest" city input event handler.
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onCityInputValueHelpOpen: function (oEvent) {
				const sInputValue = oEvent.getSource().getValue();
				let iKey;
				if (!this.oCityValueHelpDialog) {
					this.loadFragment({
						name: "pavel.kliuiko.view.fragments.CityEditValueHelpDialog",
						controller: this,
					}).then(
						function (oDialog) {
							this.oCityValueHelpDialog = oDialog;
							this.getView().addDependent(
								this.oCityValueHelpDialog
							);
							this.oCityValueHelpDialog
								.getTableAsync()
								.then(this._fillValueHelpTable.bind(this));

							this.appViewModel
								.getProperty("/suppliersInfo/cities")
								.forEach(oCity =>
									oCity.cityName === sInputValue
										? (iKey = oCity.cityId)
										: null
								);

							this.oCityValueHelpDialog.setTokens([
								new Token({
									key: iKey,
									text: sInputValue,
								}),
							]);
							this.oCityValueHelpDialog.update();
							this.oCityValueHelpDialog.open();
						}.bind(this)
					);
				} else {
					this.oCityValueHelpDialog.setTokens([
						new Token({
							key: oEvent.getSource().getSelectedKey(),
							text: sInputValue,
						}),
					]);
					this.oCityValueHelpDialog.update();
					this.oCityValueHelpDialog.open();
				}
			},

			/**
			 * Fill data to the city valueHelp table.
			 *
			 * @param {sap.ui.table.Table} oTable city valueHelp table.
			 *
			 */
			_fillValueHelpTable: function (oTable) {
				oTable.setModel(this.appViewModel, "appViewModel");
				if (oTable.bindRows) {
					oTable.addColumn(
						new Column({
							label: new Label({
								text: "Cities",
							}),
							template: new Text({
								text: "{appViewModel>cityName}",
							}),
						})
					);
					oTable.bindAggregation("rows", {
						path: "appViewModel>/suppliersInfo/cities",
					});
				}
				this.oCityValueHelpDialog.update();
			},

			/**
			 * "Cancel" event handler of city value help dialog .
			 */
			onCityValueHelpCancel: function () {
				this.oCityValueHelpDialog.close();
			},

			/**
			 * "onAfterClose" event handler of city value help dialog .
			 */
			onAfterCityValueHelpClose: function () {
				this.oCityValueHelpDialog.setTokens([]);
			},

			/**
			 * "liveChange" event handler of city input for checking validation.
			 *
			 * @returns {boolean} input validation state.
			 */
			onCityInputValueCheck: function () {
				const sErrorMessage = this._getI18nText(
					"CityInputErrorMessage"
				);
				const oCityInput = this.byId("newSupplierCityInput");
				const sMessageTarget =
					oCityInput.getBinding("value").oContext.sPath +
					"/" +
					oCityInput.getBindingPath("value");

				const oMessage = new sap.ui.core.message.Message({
					message: sErrorMessage,
					type: sap.ui.core.MessageType.Error,
					target: sMessageTarget,
					processor: this.oDataModel,
				});
				const aMessages = Messaging.getMessageModel().getData();
				Messaging.removeMessages(
					aMessages.filter(
						el => el.getTarget() === oMessage.getTargets()[0]
					)
				);

				const aCities = this.appViewModel.getProperty(
					"/suppliersInfo/cities"
				);
				const sCityValue = oCityInput.getValue();
				const bInputValid = aCities
					.map(oCity => oCity.cityName)
					.includes(sCityValue);
				if (!bInputValid) {
					Messaging.addMessages(oMessage);
				}
				return bInputValid;
			},

			/**
			 * CityEditValueHelpDialog "ok" event handler.
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onCitySelect: function (oEvent) {
				const oCityInput = this.getView().byId("newSupplierCityInput");
				const aTokens = oEvent.getParameter("tokens");
				if (aTokens.length) {
					oCityInput.setSelectedKey(aTokens[0].getKey());
				}
				this.onCityInputValueCheck();
				this.onCityValueHelpCancel();
			},

			/**
			 * "Save" supplier button press event handler.
			 *
			 * @param {string} sSupplierInputsFieldGroupId id of suppliers inputs field group
			 *
			 */
			onSaveSupplierPress: function (sSupplierInputsFieldGroupId) {
				const sInputValidationErrorText = this._getI18nText(
					"InputValidationErrorText"
				);
				let bValidationError = false;
				const aSupplierInputs = this.getView()
					.getControlsByFieldGroupId(sSupplierInputsFieldGroupId)
					.filter(el => el.isA("sap.m.Input"))
					.filter(el => !el.getId().endsWith("-popup-input"));

				aSupplierInputs.forEach(oInput => {
					bValidationError =
						this._validateInput(oInput) || bValidationError;
				});
				bValidationError =
					!this.onCityInputValueCheck() || bValidationError;
				bValidationError =
					!this.onCountrySelectValidate() || bValidationError;
				if (!bValidationError) {
					this.oDataModel.submitChanges();
					this.stateModel.getProperty("/editMode") &&
						this.getOwnerComponent().getRouter().navTo(
							"SupplierDetails",
							{
								SupplierID: this.sSupplierId,
								Mode: "Display",
							},
							true
						);
				} else {
					MessageBox.alert(sInputValidationErrorText);
				}
			},

			/**
			 * "Change" event handler of country input for checking validation.
			 *
			 * @returns {boolean} input validation state.
			 */
			onCountrySelectValidate: function () {
				const sErrorMessage = this._getI18nText(
					"CountryInputErrorMessage"
				);
				const oCountrySelect = this.byId("newSupplierCountryInput");
				const sMessageTarget =
					oCountrySelect.getBinding("selectedKey").oContext.sPath +
					"/" +
					oCountrySelect.getBindingPath("selectedKey");
				const oMessage = new sap.ui.core.message.Message({
					message: sErrorMessage,
					type: sap.ui.core.MessageType.Error,
					target: sMessageTarget,
					processor: this.oDataModel,
				});
				const aMessages = Messaging.getMessageModel().getData();
				Messaging.removeMessages(
					aMessages.filter(
						el => el.getTarget() === oMessage.getTargets()[0]
					)
				);
				const bInputValid = oCountrySelect.getSelectedKey();
				if (!bInputValid) {
					Messaging.addMessages(oMessage);
				}
				return bInputValid;
			},

			/**
			 * "change" and "liveChange" event handler of date input for checking validation.
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onDateInputValidate: function (oEvent) {
				this._deleteMessagingMessages(oEvent.getSource());
				const sErrorMessage = this._getI18nText(
					"DateInputErrorMessage"
				);
				const sDateValue = oEvent.getParameter("value");
				const oDateInput = oEvent.getSource();
				const sMessageTarget =
					oDateInput.getBinding("value").oContext.sPath +
					"/" +
					oDateInput.getBindingPath("value");
				const oMessage = new sap.ui.core.message.Message({
					message: sErrorMessage,
					type: sap.ui.core.MessageType.Error,
					target: sMessageTarget,
					processor: this.oDataModel,
				});
				const aMessages = Messaging.getMessageModel().getData();
				Messaging.removeMessages(
					aMessages.filter(
						el => el.getTarget() === oMessage.getTargets()[0]
					)
				);
				let bInputValid = true;
				const datePattern = /^\d{2}\/\d{2}\/\d{2}$/;
				if (sDateValue) {
					bInputValid = datePattern.test(sDateValue);
				}
				if (!bInputValid) {
					Messaging.addMessages(oMessage);
				}
			},

			/**
			 * Error validation messages button "press" event handler.
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onValidationMessagePopoverOpen: function (oEvent) {
				const oSourceControl = oEvent.getSource();
				this._getValidationMessagePopover().then(function (
					oValidationMessagePopover
				) {
					oValidationMessagePopover.openBy(oSourceControl);
				});
			},

			/**
			 * Cancel editing mode button "press" event handler.
			 *
			 */
			onDiscardPopoverOpen: function () {
				const oCancelBtn = this.byId("cancelEditModeBtn");
				const oProductsTable = this.byId("editProductsTable");
				const aInputs = this.getView()
					.getControlsByFieldGroupId("newSupplierInputs")
					.filter(el => el.isA("sap.m.Input"))
					.filter(el => !el.getId().endsWith("-popup-input"));
				let bValidationError = false;

				aInputs.forEach(oInput => {
					bValidationError =
						oInput.getValueState() === ValueState.Error ||
						bValidationError;
				});

				if (!this.oDataModel.hasPendingChanges() && !bValidationError) {
					this.onCancelChangesPress();
				} else {
					this._getDiscardPopover().then(function (oDiscardPopover) {
						oDiscardPopover.openBy(oCancelBtn);
					});
				}
				oProductsTable.removeSelections();
				this.onCheckSelectedProducts();
			},

			/**
			 * Get validation message popover.
			 *
			 * @returns {Promise | Object} validation message popover.
			 */
			_getValidationMessagePopover: function () {
				const oView = this.getView();
				if (!this.pValidationMessagePopover) {
					this.pValidationMessagePopover = this.loadFragment({
						name: "pavel.kliuiko.view.fragments.ValidationMessagePopover",
					}).then(function (oValidationMessagePopover) {
						oView.addDependent(oValidationMessagePopover);
						return oValidationMessagePopover;
					});
				}
				return this.pValidationMessagePopover;
			},

			/**
			 * Get discard changes popover.
			 *
			 * @returns {Promise | Object} discard changes popover.
			 */
			_getDiscardPopover: function () {
				const oView = this.getView();
				if (!this.pDiscardPopover) {
					this.pDiscardPopover = this.loadFragment({
						name: "pavel.kliuiko.view.fragments.DiscardPopover",
					}).then(function (oDiscardPopover) {
						oView.addDependent(oDiscardPopover);
						return oDiscardPopover;
					});
				}
				return this.pDiscardPopover;
			},

			/**
			 * Check selected products & set enabled property to products delete button.
			 */
			onCheckSelectedProducts: function () {
				const oProductsTable = this.getView().byId("editProductsTable");
				const aSelectedItems = oProductsTable.getSelectedItems();
				this.stateModel.setProperty(
					"/productsDeleteBtn",
					!!aSelectedItems.length
				);
			},

			/**
			 * "Delete" products button press event handler.
			 */
			onDeleteSelectedProducts: function () {
				const sConfirmTitle = this._getI18nText("ConfirmTitle");
				const oProductsTable = this.getView().byId("editProductsTable");
				const aSelectedItems = oProductsTable.getSelectedItems();
				const sProductsSuccessDeletingMsg = this._getI18nText(
					aSelectedItems.length > 1
						? "ProductsSuccessDeletingMsg"
						: "ProductSuccessDeletingMsg"
				);
				const sProductsErrorDeletingMsg = this._getI18nText(
					aSelectedItems.length > 1
						? "ProductsErrorDeletingMsg"
						: "ProductErrorDeletingMsg"
				);

				let sSelectedProductName;
				aSelectedItems.forEach(
					el =>
						(sSelectedProductName = el
							.getBindingContext()
							.getObject("Name"))
				);

				const sConfirmText =
					aSelectedItems.length > 1
						? this._getI18nText(
								"ProductsDeletingConfirmText",
								aSelectedItems.length.toString()
						  )
						: this._getI18nText(
								"ProductDeletingConfirmText",
								sSelectedProductName
						  );

				MessageBox.confirm(sConfirmText, {
					title: sConfirmTitle,
					onClose: function (sAction) {
						if (sAction === "OK") {
							this._deleteSelectedProducts(
								sProductsSuccessDeletingMsg,
								sProductsErrorDeletingMsg
							);
						} else {
							oProductsTable.removeSelections();
							this.onCheckSelectedProducts();
						}
					}.bind(this),
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.OK,
				});
			},

			/**
			 * Delete selected products.
			 */
			_deleteSelectedProducts: function (sSuccessMsg, sErrorMsg) {
				const oProductsTable = this.getView().byId("editProductsTable");
				const aSelectedItems = oProductsTable.getSelectedItems();

				aSelectedItems.forEach(oItem => {
					const oProduct = oItem.getBindingContext().getObject();
					const sProductKey = this.oDataModel.createKey(
						"/Products",
						oProduct
					);
					this.oDataModel.remove(sProductKey, {
						success: function () {
							MessageToast.show(sSuccessMsg);
						},
						error: function () {
							MessageBox.error(sErrorMsg);
						},
					});
				});

				oProductsTable.removeSelections();
				this.onCheckSelectedProducts();
			},

			/**
			 * "Open new product dialog" button press event handler.
			 */
			onOpenNewProductDialogPress: function () {
				const sProductSuccessCreatingMsg = this._getI18nText(
					"ProductSuccessCreatingMsg"
				);
				const sProductErrorCreatingMsg = this._getI18nText(
					"ProductErrorCreatingMsg"
				);
				this._saveSupplierErrMsgs();
				let oPromiseDialog;
				if (!this.oNewProductDialog) {
					oPromiseDialog = this.loadFragment({
						name: "pavel.kliuiko.view.fragments.NewProductDialog",
					}).then(
						function (oDialog) {
							this.oNewProductDialog = oDialog;
						}.bind(this)
					);
				} else {
					oPromiseDialog = Promise.resolve();
				}
				oPromiseDialog.then(() => {
					const oNewProductCtx = this.oDataModel.createEntry(
						`/Suppliers(${this.sSupplierId})/Products`,
						{
							properties: {
								ID: this._createNewId(),
								Name: "",
								Description: "",
								ReleaseDate: new Date(),
								DiscontinuedDate: null,
								Rating: 0,
								Price: 0,
								Supplier: this.sSupplierId,
							},
							success: function () {
								this.onNewProductDialogCancelPress();
								MessageToast.show(sProductSuccessCreatingMsg);
							}.bind(this),
							error: function () {
								MessageBox.error(sProductErrorCreatingMsg);
							},
						}
					);
					this.oNewProductDialog.bindObject({
						path: oNewProductCtx.getPath(),
					});
					this.oNewProductDialog.open();
				});
			},

			/**
			 * "Open edit product dialog" button press event handler.
			 */
			onOpenEditProductDialogPress: function (oEvent) {
				this._saveSupplierErrMsgs();
				let oPromiseDialog;
				if (!this.oEditProductDialog) {
					oPromiseDialog = this.loadFragment({
						name: "pavel.kliuiko.view.fragments.EditProductDialog",
					}).then(
						function (oDialog) {
							this.oEditProductDialog = oDialog;
						}.bind(this)
					);
				} else {
					oPromiseDialog = Promise.resolve();
				}
				oPromiseDialog.then(() => {
					const oProductCtx = oEvent.getSource().getBindingContext();
					this.oEditProductDialog.bindObject({
						path: oProductCtx.getPath(),
					});
					this.oEditProductDialog.open();
				});
			},

			/**
			 * "Save" product button press event handler.
			 *
			 * @param {string} sInputsFieldGroupId id of inputs field group
			 *
			 */
			onSaveProductPress: function (sInputsFieldGroupId) {
				const sInputValidationErrorText = this._getI18nText(
					"InputValidationErrorText"
				);
				let bValidationError = false;
				const aProductInputs = this.getView()
					.getControlsByFieldGroupId(sInputsFieldGroupId)
					.filter(el => el.isA("sap.m.Input"))
					.filter(el => !el.getId().endsWith("-popup-input"));

				aProductInputs.forEach(oInput => {
					bValidationError =
						this._validateInput(oInput) || bValidationError;
				});
				if (!bValidationError) {
					this.oDataModel.submitChanges();
					if (sInputsFieldGroupId === "editProductInputs") {
						this.onEditProductDialogCancelPress();
					}
				} else {
					MessageBox.alert(sInputValidationErrorText);
				}
			},

			/**
			 * "Cancel" event handler of create new product dialog .
			 */
			onNewProductDialogCancelPress: function () {
				this.oNewProductDialog.close();
			},

			/**
			 * "Cancel" event handler of edit product dialog .
			 */
			onEditProductDialogCancelPress: function () {
				this.oEditProductDialog.close();
			},

			/**
			 * After new product dialog close event handler.
			 */
			onAfterNewProductDialogClose: function () {
				const oCtx =
					this.oNewProductDialog.getBindingContext("oDataModel");
				this.oDataModel.deleteCreatedEntry(oCtx);
				this._removeProductErrMsgs();
			},

			/**
			 * After edit product dialog close event handler.
			 */
			onAfterEditProductDialogClose: function () {
				this.oDataModel.resetChanges();
				this._removeProductErrMsgs();
			},

			/**
			 * Save suppliers error messages before product dialog open.
			 */
			_saveSupplierErrMsgs: function () {
				this.stateModel.setProperty("/supplierErrValidateBtn", false);
				const aMessages = Messaging.getMessageModel().getData();
				this.appViewModel.setProperty("/SupplierErrMsgs", aMessages);
				Messaging.removeAllMessages();
			},

			/**
			 * Remove product error messages after product dialog close.
			 */
			_removeProductErrMsgs: function () {
				this.stateModel.setProperty("/supplierErrValidateBtn", true);
				const aMessages =
					this.appViewModel.getProperty("/SupplierErrMsgs");
				Messaging.removeAllMessages();
				Messaging.addMessages(aMessages);
			},
		});
	}
);
