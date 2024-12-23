sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/ui/core/Messaging"],
	function (Controller, Messaging) {
		"use strict";
		return Controller.extend("pavel.kliuiko.controller.BaseController", {
			/**
			 * Get text from resource bundle.
			 *
			 * @param {string} sTextKey key to get text value.
			 * @param {any} args arguments for substitution in the text.
			 * @returns {string} text value.
			 */
			_getI18nText: function (sTextKey, vPlaceholders) {
				return this.getView()
					.getModel("i18n")
					.getResourceBundle()
					.getText(sTextKey, vPlaceholders);
			},

			/**
			 * Create random id.
			 */
			_createNewId: function () {
				return Math.floor(Math.random() * 10000) + 1;
			},

			/**
			 * Input "Change" event handler.
			 *
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onInputChange: function (oEvent) {
				const oInput = oEvent.getSource();
				this._validateInput(oInput);
			},

			/**
			 * Delete Messaging messages.
			 *
			 * @param {sap.m.Input} oInput input control.
			 */
			_deleteMessagingMessages: function (oInput) {
				const sMessagingMsgTarget = oInput.sId + "/value";
				const aMessagingMsgs = Messaging.getMessageModel().getData();
				Messaging.removeMessages(
					aMessagingMsgs.filter(
						el => el.getTarget() === sMessagingMsgTarget
					)
				);
			},

			/**
			 * Validate inputs.
			 *
			 * @param {sap.m.Input} oInput input control.
			 *
			 * @returns {boolean} boolean validation error.
			 */
			_validateInput: function (oInput) {
				this._deleteMessagingMessages(oInput);
				let sErrorMessage;
				const oModel = oInput.getBinding("value").oModel;
				const sMessageTarget =
					oInput.getBinding("value").oContext.sPath +
					"/" +
					oInput.getBindingPath("value");
				const aMessages = Messaging.getMessageModel().getData();
				Messaging.removeMessages(
					aMessages.filter(el => el.getTarget() === sMessageTarget)
				);
				let bValidationError = false;
				const oBinding = oInput.getBinding("value");
				try {
					oBinding.getType().validateValue(oInput.getValue());
					if (!oInput.getValue().trim()) {
						throw new Error();
					}
				} catch (oException) {
					sErrorMessage = oException.message;
					bValidationError = true;
				}
				if (bValidationError) {
					const oMessage = new sap.ui.core.message.Message({
						message: sErrorMessage,
						type: sap.ui.core.MessageType.Error,
						target: sMessageTarget,
						processor: oModel,
					});
					Messaging.addMessages(oMessage);
				}
				return bValidationError;
			},
		});
	}
);
