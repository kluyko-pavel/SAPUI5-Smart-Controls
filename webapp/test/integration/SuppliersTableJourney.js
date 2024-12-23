sap.ui.define(
	[
		"sap/ui/test/opaQunit",
		"./pages/SuppliersTable",
		"./pages/SupplierDetails",
	],
	function (opaTest) {
		"use strict";

		QUnit.module("SuppliersTable Journey");

		opaTest(
			"Should see the table with 2 suppliers and disabled deletion button",
			function (Given, When, Then) {
				Given.iStartMyApp();

				Then.onTheSuppliersTable.theTableShouldHaveSuppliers(2); 
				Then.onTheSuppliersTable.theDeleteButtonShouldHaveEnablement(
					false
				);
			}
		);

		opaTest(
			"Should be possible to select a supplier, after which the delete button will be enabled.",
			function (Given, When, Then) {
				When.onTheSuppliersTable.iSelectListItem();
				Then.onTheSuppliersTable.theDeleteButtonShouldHaveEnablement(
					true
				);
			}
		);

		opaTest(
			"Should press the 'Delete' button after which 'confirmation' dialog is open",
			function (Given, When, Then) {
				When.onTheSuppliersTable.iPressOnDeleteButton();
				Then.onTheSuppliersTable.iShouldSeeConfirmationDialog();
			}
		);

		opaTest(
			"Should confirm supplier deletion and see table with 1 supplier",
			function (Given, When, Then) {
				When.onTheSuppliersTable.iClickOnConfirmDeleteButton();
				Then.onTheSuppliersTable.theTableShouldHaveSuppliers(1);

				Then.iTeardownMyApp();
			}
		);

		opaTest(
			"Should choose the supplier after which supplier details page is open  in 'display' mode",
			function (Given, When, Then) {
				Given.iStartMyApp();
				When.onTheSuppliersTable.iPressOnSupplier();
				Then.onTheSupplierDetails.iShouldSeeThePageView();

				Then.iTeardownMyApp();
			}
		);

		opaTest(
			"Should press the 'Create' button after which supplier details page is open in 'create' mode",
			function (Given, When, Then) {
				Given.iStartMyApp();
				When.onTheSuppliersTable.iPressOnCreateButton();
				Then.onTheSupplierDetails.iShouldSeeCreateMode();
			}
		);
	}
);
