import { Core } from "nodets-ms-core";
import { QueueMessage } from "nodets-ms-core/lib/core/queue";
import { TdeiObjectFaker } from "../common/tdei-object-faker";
import { mockQueueMessageContent } from "../common/mock-utils";
import { GtfsFlexDTO } from "../../src/model/gtfs-flex-dto";
import gtfsFlexService from "../../src/service/gtfs-flex-service";
import { EventBusService } from "../../src/service/event-bus-service";
import { PermissionRequest } from "nodets-ms-core/lib/core/auth/model/permission_request";
import { environment } from "../../src/environment/environment";
import { Utility } from "../../src/utility/utility";
import { setTimeout } from "timers/promises";
import fetch from "node-fetch";


describe("Flex Integration Test", () => {

    afterAll((done) => {
        done();
    });


    /**
     * Environment dependency
     * QUEUE CONNECTION
     */

    test("Subscribe to validation result topic to verify servicebus integration", async () => {
        //Pre-requsite environment dependency
        if (!process.env.QUEUECONNECTION) {
            console.error("QUEUECONNECTION environment not set");
            expect(process.env.QUEUECONNECTION != undefined && process.env.QUEUECONNECTION != null).toBeTruthy();
            return;
        }

        //Arrange
        var messageReceiver!: QueueMessage;

        Core.initialize();
        var topicToSubscribe = Core.getTopic("temp-validation", {
            provider: "Azure"
        });
        //Live: validation service posts message
        await topicToSubscribe.publish(QueueMessage.from(TdeiObjectFaker.getGtfsFlexQueueMessageSuccess()));

        //Mock publishing topic - outbound
        var mockPublishingTopic = Core.getTopic("Mock");
        jest.spyOn(mockPublishingTopic, "publish").mockImplementation((message: QueueMessage) => {
            messageReceiver = message;
            return Promise.resolve();
        });

        mockQueueMessageContent();

        var dummyResponse = <GtfsFlexDTO>{
            tdei_record_id: "test_record_id"  
        };

        //Mock DB call
        jest
            .spyOn(gtfsFlexService, "createGtfsFlex")
            .mockResolvedValueOnce(dummyResponse);

        //Wait for message to process
        async function assertMessage() {
           await setTimeout(20000);
            return Promise.resolve(messageReceiver?.data?.response?.success);
        }

        //Act
        var eventBusService = new EventBusService();
        eventBusService.publishingTopic = mockPublishingTopic;
        eventBusService.subscribeTopic();

        //Assert
        await expect(assertMessage()).resolves.toBeTruthy();
    }, 60000);


     /**
     * Environement dependency 
     * AUTH_HOST
     */
    test("Verifying auth service hasPermission api integration", async () => {
        //Pre-requisite environment dependency
        if (!process.env.AUTH_HOST) {
            console.error("AUTH_HOST environment not set");
            expect(process.env.AUTH_HOST != undefined && process.env.AUTH_HOST != null).toBeTruthy();
            return;
        }

        //Arrange
        var permissionRequest = new PermissionRequest({
            userId: "test_userId",
            orgId: "test_orgId",
            permssions: ["tdei-admin", "poc", "flex_data_generator"],
            shouldSatisfyAll: false
        });
        const authProvider = Core.getAuthorizer({ provider: "Hosted", apiUrl: environment.authPermissionUrl });
        //ACT
        const response = await authProvider?.hasPermission(permissionRequest);
        //Assert
        expect(response).toBeFalsy();
    }, 15000);

     /**
     * Environement dependency 
     * AUTH_HOST
     */
     test("Verifying auth service generate secret api integration", async () => {
        //Pre-requisite environment dependency
        if (!process.env.AUTH_HOST) {
            console.error("AUTH_HOST environment not set");
            expect(process.env.AUTH_HOST != undefined && process.env.AUTH_HOST != null).toBeTruthy();
            return;
        }

        //Act
        const getSecret = await fetch(environment.secretGenerateUrl as string, {
            method: 'get'
        });
        //Assert
        expect(getSecret.status == 200).toBeTruthy();
    }, 15000);

     /**
     * Environement dependency 
     * STATION_URL
     */
     test("Verifying service get service api integration", async () => {
        //Pre-requisite environment dependency
        if (!process.env.SERVICE_URL) {
            console.error("SERVICE_URL environment not set");
            expect(process.env.SERVICE_URL != undefined && process.env.SERVICE_URL != null).toBeTruthy();
            return;
        }

        //Arrange
        let secretToken = await Utility.generateSecret();
        //Act
        const result = await fetch(`${environment.serviceUrl}?tdei_service_id=test-serviceId&tdei_org_id=test-orgId&page_no=1&page_size=1`, {
            method: 'get',
            headers: { 'Content-Type': 'application/json', 'x-secret': secretToken }
        });

        //Assert
        expect(result.status == 200).toBeTruthy();
    }, 15000);


    

});