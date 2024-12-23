sap.ui.define(
	["sap/ui/test/Opa5", "sap/ui/test/actions/Press"],
	function (Opa5, Press) {
		"use strict";
		const sViewName = "SupplierDetails";

		Opa5.createPageObjects({
			onTheSupplierDetails: {
				actions: {
					iPressOnCancelButton() {
						return this.waitFor({
							id: "cancelEditModeBtn",
							viewName: sViewName,
							actions: new Press(),
							success() {
								Opa5.assert.ok(
									true,
									"The Delete button is pressed"
								);
							},
							errorMessage: "Can't press delete button",
						});
					},
					iPressOnDiscardButton() {
						return this.waitFor({
							id: "discardChangesBtn",
							viewName: sViewName,
							actions: new Press(),
							success() {
								Opa5.assert.ok(
									true,
									"The Delete button is pressed"
								);
							},
							errorMessage: "Can't press delete button",
						});
					},
				},

				assertions: {
					iShouldSeeThePageView() {
						return this.waitFor({
							autoWait: true,
							id: "supplierDetailsPage",
							viewName: sViewName,
							success() {
								Opa5.assert.ok(
									true,
									`The ${sViewName} view is displayed`
								);
							},
							errorMessage: `Did not find the ${sViewName} view`,
						});
					},

					iShouldSeeCreateMode() {
						return this.waitFor({
							id: "supplierDetailsPage",
							viewName: sViewName,
							success() {
								Opa5.assert.ok(
									true,
									"The create mode is visible"
								);
							},
							errorMessage: "The create mode is not visible",
						});
					},

					iShouldSeeConfirmationPopover() {
						return this.waitFor({
							viewName: sViewName,
							controlType: "sap.m.Popover",
							searchOpenDialogs: true,
							success() {
								Opa5.assert.ok(
									true,
									"The confirmation popover is visible"
								);
							},
							errorMessage:
								"The confirmation popover is not visible",
						});
					},
				},
			},
		});
	}
);
