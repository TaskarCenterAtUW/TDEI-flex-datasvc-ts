import { FlexVersions } from "../database/entity/flex-version-entity";
import { GtfsFlexUploadModel } from "../model/gtfs-flex-upload-model";
import gtfsFlexService from "./gtfs-flex-service";
import { IEventBusServiceInterface } from "./interface/event-bus-service-interface";
import { validate } from 'class-validator';
import { AzureQueueConfig } from "nodets-ms-core/lib/core/queue/providers/azure-queue-config";
import { environment } from "../environment/environment";
import { Core } from "nodets-ms-core";

class EventBusService implements IEventBusServiceInterface {
    private queueConfig: AzureQueueConfig;

    constructor() {
        this.queueConfig = new AzureQueueConfig();
        this.queueConfig.connectionString = environment.eventBus.connectionString as string;
    }

    /**
     * Funtion triggers on new message received from the queue
     * @param messageReceived Mesage from queue
     */
    private processUpload = async (messageReceived: any) => {
        try {
            if (!messageReceived.data || !messageReceived.data.is_valid) {
                console.log("Not valid information received :", messageReceived);
                return;
            }

            var gtfsFlexUploadModel = messageReceived.data as GtfsFlexUploadModel;
            var flexVersions: FlexVersions = new FlexVersions(gtfsFlexUploadModel);
            flexVersions.uploaded_by = gtfsFlexUploadModel.user_id;
            console.log(`Received message: ${JSON.stringify(gtfsFlexUploadModel)}`);

            validate(flexVersions).then(errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.log('Upload flex file metadata information failed validation. errors: ', errors);
                } else {
                    gtfsFlexService.createAGtfsFlex(flexVersions).catch((error: any) => {
                        console.log('Error saving the flex version');
                        console.log(error);
                    });;
                }
            });
        } catch (error) {
            console.log("Error processing the upload message : error ", error, "message: ", messageReceived);
        }
    };


    /**
     * Funtion triggers when there is any error while listening/receiving the queue message
     * @param error Error details
     */
    private processUploadError = async (error: any) => {
        console.log(error);
    };

    /**
     * Subscribing to the interested topic & subscription to process the queue message
     */
    subscribeTopic(): void {
        Core.getTopic(environment.eventBus.validationTopic as string,
            this.queueConfig)
            .subscribe(environment.eventBus.validationSubscription as string, {
                onReceive: this.processUpload,
                onError: this.processUploadError
            });
    }
}

const eventBusService: IEventBusServiceInterface = new EventBusService();
export default eventBusService;