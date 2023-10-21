import { FlexVersions } from "../database/entity/flex-version-entity";
import gtfsFlexService from "./gtfs-flex-service";
import { IEventBusServiceInterface } from "./interface/event-bus-service-interface";
import { validate, ValidationError } from 'class-validator';
import { AzureQueueConfig } from "nodets-ms-core/lib/core/queue/providers/azure-queue-config";
import { environment } from "../environment/environment";
import { Core } from "nodets-ms-core";
import { QueueMessageContent } from "../model/queue-message-model";
import { Topic } from "nodets-ms-core/lib/core/queue/topic";
import { QueueMessage } from "nodets-ms-core/lib/core/queue";
import { randomUUID } from "crypto";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import { GtfsFlexUploadMeta } from "../model/gtfs-flex-upload-meta";

export class EventBusService implements IEventBusServiceInterface {
    private queueConfig: AzureQueueConfig;
    public publishingTopic: Topic;
    public uploadTopic: Topic;

    constructor(queueConnection: string = environment.eventBus.connectionString as string, publishingTopicName: string = environment.eventBus.dataServiceTopic as string) {
        Core.initialize();
        this.queueConfig = new AzureQueueConfig();
        this.queueConfig.connectionString = queueConnection;
        this.publishingTopic = Core.getTopic(publishingTopicName);
        this.uploadTopic = Core.getTopic(environment.eventBus.uploadTopic as string);
    }

    /**
     * Funtion triggers on new message received from the queue
     * @param messageReceived Mesage from queue
     */
    private processUpload = async (messageReceived: any) => {
        let tdeiRecordId = "";
        try {
            const queueMessage = QueueMessageContent.from(messageReceived.data);

            if (queueMessage.tdeiRecordId !== null && queueMessage.tdeiRecordId !== undefined) {
                tdeiRecordId = queueMessage.tdeiRecordId;
            }
            

            console.log("Received message for : ", queueMessage.tdeiRecordId, "Message received for flex processing !");

            if (!queueMessage.response.success) {
                const errorMessage = "Received failed workflow request";
                console.error(queueMessage.tdeiRecordId, errorMessage, messageReceived);
                return Promise.resolve();
            }

            if (!await queueMessage.hasPermission(["tdei-admin", "poc", "flex_data_generator"])) {
                const errorMessage = "Unauthorized request !";
                console.error(queueMessage.tdeiRecordId, errorMessage);
                throw Error(errorMessage);
            }
            console.log("Queue message");
            console.log(queueMessage.request);

            const flexVersions: FlexVersions = FlexVersions.from(queueMessage.request);
            flexVersions.tdei_record_id = queueMessage.tdeiRecordId;
            flexVersions.uploaded_by = queueMessage.userId;
            flexVersions.file_upload_path = queueMessage.meta.file_upload_path;
            console.info(`Received message: ${messageReceived.data}`);

            validate(flexVersions).then(errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    const message = errors.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
                    console.error('Upload flex file metadata information failed validation. errors: ', errors);
                    this.publish(messageReceived,
                        {
                            success: false,
                            message: 'Upload flex file metadata information failed validation. errors:' + message
                        });
                    return Promise.resolve();
                } else {
                    // No need to store. already stored in upload.
                    console.info(`Flex record created successfully !`);
                     this.publish(messageReceived,
                         {
                             success: true,
                             message: 'Flex request processed successfully !'
                         });
                     return Promise.resolve();
                }
            }).catch(async (error) => {
                // Throw metadata validation errors
                console.log('Failed to validate the flex versions');
               await this.publish(messageReceived,
                    {
                        success: false,
                        message: 'Error with metadata' + error
                    });
                return Promise.resolve();
            });

        } catch (error) {
            console.error(tdeiRecordId, 'Error occured while processing flex request', error);
           await this.publish(messageReceived,
                {
                    success: false,
                    message: 'Error occured while processing flex request' + error
                });
            return Promise.resolve();
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
    subscribeTopic(validationTopic: string = environment.eventBus.validationTopic as string, validationSubscription: string = environment.eventBus.validationSubscription as string): void {
        Core.getTopic(environment.eventBus.validationTopic as string,
            this.queueConfig)
            .subscribe(validationSubscription, {
                onReceive: this.processUpload,
                onError: this.processUploadError
            });
    }

    private async publish(queueMessage: QueueMessage, response: {
        success: boolean,
        message: string
    }) {
        const queueMessageContent: QueueMessageContent = QueueMessageContent.from(queueMessage.data);
        //Set validation stage
        queueMessageContent.stage = 'flex-data-service';
        //Set response
        queueMessageContent.response.success = response.success;
        queueMessageContent.response.message = response.message;
        // Dont publish during development
       await this.publishingTopic.publish(QueueMessage.from(
            {
                messageType: 'flex-data-service',
                data: queueMessageContent,
                publishedDate: new Date(),
                message: "Flex data service output",
                messageId: randomUUID().toString()
            }
        ));
        console.log("Publishing message for : ", queueMessageContent.tdeiRecordId);
    }

    /**
     * Publishes the upload of a gtfs-flex file
     */
    public publishUpload(request:GtfsFlexUploadMeta, recordId:string,file_upload_path:string, userId:string, meta_file_path:string){
       const messageContent =  QueueMessageContent.from({
            stage:'flex-upload',
            request:request,
            userId:userId,
            orgId:request.tdei_org_id,
            tdeiRecordId:recordId,
            meta:{
                'file_upload_path':file_upload_path,
                'meta_file_path':meta_file_path
            },
            response:{
                success:true,
                message:'File uploaded for the organization: '+request.tdei_org_id+' with record id'+recordId
            }
        });
        const message = QueueMessage.from(
            {
                messageType:'gtfs-flex-upload',
                data:messageContent,

            }
        )
        this.uploadTopic.publish(message);
    }
}


// const eventBusService = new EventBusService();
// export default eventBusService;