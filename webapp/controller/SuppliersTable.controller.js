sap.ui.define(
	[
		"pavel/kliuiko/controller/BaseController",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"sap/ui/core/Messaging",
		"sap/ui/core/EventBus",
	],
	function (
		Controller,
		Filter,
		FilterOperator,
		MessageBox,
		MessageToast,
		Messaging,
		EventBus
	) {
		"use strict";

		return Controller.extend("pavel.kliuiko.controller.SuppliersTable", {
			/**
			 * Controller's "init" lifecycle method.
			 */
			onInit: function () {
				this.oDataModel = this.getOwnerComponent().getModel();
				this.appViewModel =
					this.getOwnerComponent().getModel("appViewModel");
				this.stateModel =
					this.getOwnerComponent().getModel("stateModel");
				this.stateModel.setProperty("/supplierDeleteBtn", false);
				Messaging.registerObject(this.getView(), true);
				this.getView().setModel(
					Messaging.getMessageModel(),
					"messages"
				);
			},

			/**
			 * "Press" event handler of countries getting button.
			 */
			onGetCountriesDataPress: function () {
				EventBus.getInstance().publish(
					"countryChannel",
					"requestCountryDataClick"
				);
			},

			/**
			 * Open supplier details page press event handler.
			 *
			 * @param {sap.ui.base.Event} oEvent event object.
			 */
			onSupplierTablePress: function (oEvent) {
				const oSource = oEvent.getSource();
				const oCtx = oSource.getBindingContext();
				this.getOwnerComponent()
					.getRouter()
					.navTo("SupplierDetails", {
						SupplierID: oCtx.getObject("ID"),
						Mode: "Display",
					});
			},

			/**
			 * "Search" event handler of the suppliers.
			 */
			onSuppliersSearch: function () {
				const oSuppliersTable = this.getView().byId("idSuppliersTable");
				const aTableFilters = this.getView()
					.byId("suppliersSmartFilterBar")
					.getFiltersWithValues()
					.reduce(
						function (aResult, oFilterGroupItem) {
							const oControl = oFilterGroupItem.getControl();
							if (
								oControl.isA("sap.m.MultiComboBox") ||
								oControl.isA("sap.m.MultiInput")
							) {
								this._addMultiInputsFilters(
									oControl,
									oFilterGroupItem,
									aResult
								);
							} else {
								this._addSearchFieldFilter(
									oControl,
									oFilterGroupItem,
									aResult
								);
							}
							return aResult;
						}.bind(this),
						[]
					);
				oSuppliersTable.getBinding("items").filter(aTableFilters);
			},

			/**
			 * Add filters to multiInput & multiComboBox.
			 *
			 * @param {sap.m.MultiInput | sap.m.MultiComboBox} oControl multiInput or multiComboBox control.
			 * @param {sap.ui.comp.filterbar.FilterGroupItem} oFilterGroupItem   filterGroupItem  control.
			 * @param {Array} aResult array of filters.
			 *
			 */
			_addMultiInputsFilters: function (
				oControl,
				oFilterGroupItem,
				aResult
			) {
				const aSelectedItems = oControl.isA("sap.m.MultiComboBox")
					? oControl.getSelectedItems()
					: oControl.getTokens();
				const aFilters = aSelectedItems.map(oSelectedItem => {
					const sSelectedText = oControl.isA("sap.m.MultiComboBox")
						? oSelectedItem.getText()
						: oSelectedItem
								.getText()
								.replace(/\(\d+\)$/, "")
								.trim();
					return new Filter({
						path: `Address/${oFilterGroupItem.getName()}`,
						operator: FilterOperator.Contains,
						value1: sSelectedText,
					});
				});
				if (aSelectedItems.length) {
					aResult.push(
						new Filter({
							filters: aFilters,
							and: false,
						})
					);
				}
			},

			/**
			 * Add filters to searchField.
			 *
			 * @param {sap.m.SearchField} oControl searchField control.
			 * @param {sap.ui.comp.filterbar.FilterGroupItem} oFilterGroupItem   filterGroupItem  control.
			 * @param {Array} aResult array of filters.
			 *
			 */
			_addSearchFieldFilter: function (
				oControl,
				oFilterGroupItem,
				aResult
			) {
				const sSearchValue = oControl.getValue();
				if (sSearchValue) {
					const oFilter = new Filter({
						path: oFilterGroupItem.getName(),
						operator: FilterOperator.Contains,
						value1: sSearchValue,
					});
					aResult.push(oFilter);
				}
			},

			/**
			 * "ValueHelpRequest" event handler of multi input.
			 */
			onCityFilterValueHelpOpen: function () {
				const oMultiInput = this.getView().byId("cityMultiInput");
				if (!this.oCityValueHelpDialog) {
					this.loadFragment({
						name: "pavel.kliuiko.view.fragments.CityFilterValueHelpDialog",
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

							this.oCityValueHelpDialog.setTokens(
								oMultiInput.getTokens()
							);
							this.oCityValueHelpDialog.open();
						}.bind(this)
					);
				} else {
					this.oCityValueHelpDialog.setTokens(
						oMultiInput.getTokens()
					);
					this.oCityValueHelpDialog.update();
					this.oCityValueHelpDialog.open();
				}
			},

			/**
			 * "TokenUpdate" event handler of multiInput.
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onMultiInputUpdate: function (oEvent) {
				const oMultiInput = this.getView().byId("cityMultiInput");
				if (oEvent.getParameters().type === "removed") {
					let aCurrentTokens = oMultiInput
						.getTokens()
						.filter(
							token =>
								token.getText() !==
								oEvent
									.getParameters()
									.removedTokens[0].getText()
						);
					oMultiInput.setTokens(aCurrentTokens);
				}
				this.onSuppliersSearch();
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
						new sap.ui.table.Column({
							label: new sap.m.Label({
								text: "City",
							}),
							template: new sap.m.Text({
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
			 * "Ok" event handler of city value help dialog .
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onCityValueHelpOk: function (oEvent) {
				const oMultiInput = this.getView().byId("cityMultiInput");
				const aTokens = oEvent.getParameter("tokens");
				oMultiInput.setTokens(aTokens);
				this.onCityValueHelpCancel();
				this.onSuppliersSearch();
			},

			/**
			 * "Cancel" event handler of city value help dialog .
			 */
			onCityValueHelpCancel: function () {
				this.oCityValueHelpDialog.close();
			},

			/**
			 * "AfterClose" event handler of city value help dialog .
			 */
			onAfterCityValueHelpClose: function () {
				this.oCityValueHelpDialog.setTokens([]);
			},

			/**
			 * "Clear" event handler of the supplier filters.
			 */
			onFiltersClear: function () {
				const oSuppliersTable = this.getView().byId("idSuppliersTable");
				const oFilterBar = this.getView().byId(
					"suppliersSmartFilterBar"
				);
				const aFilters = oFilterBar.getFiltersWithValues();
				aFilters.forEach(oFilter => {
					const oControl = oFilter.getControl();
					if (oControl instanceof sap.m.MultiComboBox) {
						oControl.setSelectedItems([]);
					} else if (oControl instanceof sap.m.MultiInput) {
						oControl.setTokens([]);
						oControl.setValue("");
					} else {
						oControl.setValue("");
					}
				});
				oSuppliersTable.getBinding("items").filter();
			},

			/**
			 * "Delete" suppliers button press event handler.
			 */
			onDeleteSelectedSuppliers: function () {
				const sConfirmTitle = this._getI18nText("ConfirmTitle");
				const oSuppliersTable = this.getView().byId("idSuppliersTable");
				const aSelectedItems = oSuppliersTable.getSelectedItems();
				const sSuppliersSuccessDeletingMsg = this._getI18nText(
					aSelectedItems.length > 1
						? "SuppliersSuccessDeletingMsg"
						: "SupplierSuccessDeletingMsg"
				);
				const sSuppliersErrorDeletingMsg = this._getI18nText(
					aSelectedItems.length > 1
						? "SuppliersErrorDeletingMsg"
						: "SupplierErrorDeletingMsg"
				);

				let sSelectedSupplierName;
				aSelectedItems.forEach(
					el =>
						(sSelectedSupplierName = el
							.getBindingContext()
							.getObject("Name"))
				);

				const sConfirmText =
					aSelectedItems.length > 1
						? this._getI18nText(
								"SuppliersDeletingConfirmText",
								aSelectedItems.length.toString()
						  )
						: this._getI18nText(
								"SupplierDeletingConfirmText",
								sSelectedSupplierName
						  );

				MessageBox.confirm(sConfirmText, {
					title: sConfirmTitle,
					onClose: function (sAction) {
						if (sAction === "OK") {
							this._deleteSelectedSuppliers(
								sSuppliersSuccessDeletingMsg,
								sSuppliersErrorDeletingMsg
							);
						} else {
							oSuppliersTable.removeSelections();
							this.onCheckSelectedSuppliers();
						}
					}.bind(this),
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.OK,
				});
			},

			/**
			 * Delete selected suppliers.
			 */
			_deleteSelectedSuppliers: function (sSuccessMsg, sErrorMsg) {
				const oSuppliersTable = this.getView().byId("idSuppliersTable");
				const aSelectedItems = oSuppliersTable.getSelectedItems();

				aSelectedItems.forEach(oItem => {
					const oSupplier = oItem.getBindingContext().getObject();
					const sSupplierKey = this.oDataModel.createKey(
						"/Suppliers",
						oSupplier
					);
					this.oDataModel.remove(sSupplierKey, {
						success: function () {
							MessageToast.show(sSuccessMsg);
						},
						error: function () {
							MessageBox.error(sErrorMsg);
						},
					});
				});

				oSuppliersTable.removeSelections();
				this.onCheckSelectedSuppliers();
			},

			/**
			 * Check selected suppliers & set enabled property to suppliers delete button.
			 */
			onCheckSelectedSuppliers: function () {
				const oSuppliersTable = this.getView().byId("idSuppliersTable");
				const aSelectedItems = oSuppliersTable.getSelectedItems();
				this.stateModel.setProperty(
					"/supplierDeleteBtn",
					!!aSelectedItems.length
				);
			},

			/**
			 * "Create" supplier button press event handler.
			 */
			onCreateNewSupplierPress: function () {
				this.getOwnerComponent().getRouter().navTo("SupplierDetails", {
					SupplierID: "NewSupplier",
					Mode: "Create",
				});
			},
		});
	}
);
