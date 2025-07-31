import ResourceBundle from 'sap/base/i18n/ResourceBundle';
import MessageToast from 'sap/m/MessageToast';
import Event from 'sap/ui/base/Event';
import Controller from 'sap/ui/core/mvc/Controller';
import View from 'sap/ui/core/mvc/View';
import UIComponent from 'sap/ui/core/UIComponent';
import JSONModel from 'sap/ui/model/json/JSONModel';
import ResourceModel from 'sap/ui/model/resource/ResourceModel';
import ContentResource from 'sap/ui/vk/ContentResource';
import Viewer from 'sap/ui/vk/Viewer';

/**
 * @namespace zsapbtpdecp.controller
 */
export default class MainView extends Controller {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        const oSources = {
            url1: '/model/boxTestModel.vds',
            url2: '/model/coneTestModel.vds',
            url3: '/model/cylinderTestModel.vds',
        };
        let model = new JSONModel();
        model.setData(oSources);

        this.getView()?.setModel(model, 'source');
    }

    public onPressLoadRemoteModels(event: Event): void {
        let view = this.getView();
        // set the source model to a variable
        let sourceData = (view?.getModel('source') as JSONModel)?.getData();

        // get the current viewer control
        const viewer = view?.byId('viewer') as Viewer;

        // create the list of URLs from the input fields
        let urls = [sourceData.url1, sourceData.url2, sourceData.url3];

        // if all URL inputs are empty show an alert on the screen
        // if at least one URL is specified, then take the URL list
        // and load all existing ones into the viewer
        if (this._checkIfAllInputsEmpty(urls)) this._handleEmptyUrl(view);
        else this._loadModelsIntoViewer(viewer, urls, 'vds4');
    }

    private _handleEmptyUrl(view: View | undefined): void {
        if (!view) return;

        const oI18nModel = view.getModel('i18n') as ResourceModel;
        const oBundle = oI18nModel?.getResourceBundle() as
            | ResourceBundle
            | undefined;

        if (!oBundle) return;

        const msg = oBundle.getText('missingUrl');
        MessageToast.show(msg || 'default message if i18n is not available');
    }

    private _checkIfAllInputsEmpty(urls: string[]): boolean {
        let allEmpty = true;
        for (let i = 0; i < urls.length; i++)
            if (urls[i]) {
                allEmpty = false;
                break;
            }
        return allEmpty;
    }

    private _loadModelsIntoViewer(
        viewer: Viewer,
        urls: string[],
        sourceType: string
    ): void {
        // clears all the models currently loaded in the viewer
        viewer.destroyContentResources();

        // iterates through all URLs
        // and loads all models into the viewer
        for (let i = 0; i < urls.length; i++)
            if (urls[i]) {
                let contentResource = new ContentResource({
                    source: urls[i],
                    sourceType: sourceType,
                    sourceId: i.toString(),
                    name: urls[i].split('/').pop(),
                });
                // add current model to the viewer
                viewer.addContentResource(contentResource);
            }
    }

    public onNavigateToThreeJS(): void {
        const oRouter = UIComponent.getRouterFor(this);
        oRouter.navTo("RouteThreeJS");
      }
    
}
