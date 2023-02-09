import { FlexVersions } from "../database/entity/flex-version-entity";
import gtfsFlexService from "./gtfs-flex-service";
import { IEventBusServiceInterface } from "./interface/event-bus-service-interface";
import { validate } from 'class-validator';
import { AzureQueueConfig } from "nodets-ms-core/lib/core/queue/providers/azure-queue-config";
import { environment } from "../environment/environment";
import { Core } from "nodets-ms-core";
import { QueueMessageContent } from "../model/queue-message-model";
import { Polygon } from "../model/polygon-model";

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
            var queueMessage = QueueMessageContent.from(messageReceived.data);
            if (!queueMessage.response.success && !queueMessage.meta.isValid) {
                console.error("Failed workflow request received:", messageReceived);
                return;
            }

            if (!await queueMessage.hasPermission(["tdei-admin", "poc", "flex_data_generator"])) {
                return;
            }

            var flexVersions: FlexVersions = FlexVersions.from(queueMessage.request);
            flexVersions.tdei_record_id = queueMessage.tdeiRecordId;
            flexVersions.uploaded_by = queueMessage.userId;
            flexVersions.file_upload_path = queueMessage.meta.file_upload_path;
            //This line will instantiate the polygon class and set defult class values
            flexVersions.polygon = new Polygon({ coordinates: flexVersions.polygon.coordinates });
            console.info(`Received message: ${messageReceived.data}`);

            validate(flexVersions).then(errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.error('Upload flex file metadata information failed validation. errors: ', errors);
                } else {
                    gtfsFlexService.createAGtfsFlex(flexVersions).catch((error: any) => {
                        console.error('Error saving the flex version');
                        console.error(error);
                    });;
                }
            });
        } catch (error) {
            console.error("Error processing the upload message : error ", error, "message: ", messageReceived);
        }
    };


    /**
     * Funtion triggers when there is any error while listening/receiving the queue message
     * @param error Error details
     */
    private processUploadError = async (error: any) => {
        console.error(error);
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