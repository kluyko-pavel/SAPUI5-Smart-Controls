sap.ui.define(
	[
		"sap/ui/test/opaQunit",
		"./pages/SuppliersTable",
		"./pages/SupplierDetails",
	],
	function (opaTest) {
		"use strict";

		QUnit.module("SupplierDetails Journey");

		opaTest(
			"Should press the 'Cancel' button after which discard confirmation popover  is open",
			function (Given, When, Then) {
				When.onTheSupplierDetails.iPressOnCancelButton();
				Then.onTheSupplierDetails.iShouldSeeConfirmationPopover();
			}
		);

		opaTest(
			"Should press the 'Discard' button after which suppliers table page is open",
			function (Given, When, Then) {
				When.onTheSupplierDetails.iPressOnDiscardButton();
				Then.onTheSuppliersTable.iShouldSeeThePageView();

				Then.iTeardownMyApp();
			}
		);
	}
);
