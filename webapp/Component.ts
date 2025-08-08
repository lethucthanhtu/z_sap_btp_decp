import BaseComponent from "sap/ui/core/UIComponent";
import { createDeviceModel } from "./model/models";
import UIComponent from "sap/ui/core/UIComponent";
import "sap/ui/model/json/JSONModel";

/**
 * @namespace zsapbtpdecp
 */
export default class Component extends BaseComponent {

	public static metadata = {
		manifest: "json",
        interfaces: [
            "sap.ui.core.IAsyncContentCreation"
        ]
	};

	public init() : void {
		// call the base component's init function
		super.init();

        // set the device model
        this.setModel(createDeviceModel(), "device");

        // enable routing
        this.getRouter().initialize();
	}
}

export default class Component extends UIComponent {
    public init(): void {
      super.init();
      this.getRouter().initialize(); // required if using routing
    }
  }