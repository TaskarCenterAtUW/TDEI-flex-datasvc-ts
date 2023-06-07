import flexService from "../src/service/gtfs-flex-service";
import { TdeiObjectFaker } from "./common/tdei-object-faker";
import { GtfsFlexDTO } from "../src/model/gtfs-flex-dto";
import { getMockTopic, mockCore, mockQueueMessageContent } from "./common/mock-utils";
import { QueueMessage } from "nodets-ms-core/lib/core/queue";
import { Topic } from "nodets-ms-core/lib/core/queue/topic";
import eventBusService from "../src/service/event-bus-service";

// group test using describe
describe("Queue message service", () => {
    describe("Process Queue message", () => {

        describe("Functional", () => {
            test("When valid message received, Expect to process the message successfully", async () => {
                let messagedProcessed: boolean = false;
                //Arrange
                mockQueueMessageContent(true);

                var mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeTruthy();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                var dummyResponse = <GtfsFlexDTO>{
                    tdei_record_id: "test_record_id"
                };
                const createGtfsFlexSpy = jest
                    .spyOn(flexService, "createGtfsFlex")
                    .mockResolvedValueOnce(dummyResponse);

                //Act
                await eventBusService['processUpload'](TdeiObjectFaker.getGtfsFlexQueueMessageSuccess());
            });

            test("When message with empty tdei_record_id received, Expect to fail the message processing", async () => {
                let messagedProcessed: boolean = false;
                //Arrange
                mockQueueMessageContent(true);

                var mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeFalsy();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                var dummyResponse = <GtfsFlexDTO>{
                    tdei_record_id: "test_record_id"
                };
                const createGtfsFlexSpy = jest
                    .spyOn(flexService, "createGtfsFlex")
                    .mockResolvedValueOnce(dummyResponse);

                var message = TdeiObjectFaker.getGtfsFlexQueueMessageSuccess();
                message.data.tdei_record_id = "";
                //Act
                await eventBusService['processUpload'](message);
            });

            test("When validation service failed, Expect to fail the message processing", async () => {
                //Arrange
                mockQueueMessageContent(true);

                var mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    //Assert
                    expect(true).not.toBeCalled();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                var dummyResponse = <GtfsFlexDTO>{
                    tdei_record_id: "test_record_id"
                };
                const createGtfsFlexSpy = jest
                    .spyOn(flexService, "createGtfsFlex")
                    .mockResolvedValueOnce(dummyResponse);

                var message = TdeiObjectFaker.getGtfsFlexQueueMessageSuccess();
                message.data.response.success = false;
                message.data.meta.isValid = false;
                //Act
                await eventBusService['processUpload'](message);
            });

            test("When create flex database failed, Expect to fail the message processing", async () => {
                let messagedProcessed: boolean = false;
                //Arrange
                mockQueueMessageContent(true);

                var mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeFalsy();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                const createGtfsFlexSpy = jest
                    .spyOn(flexService, "createGtfsFlex")
                    .mockRejectedValueOnce(new Error("Database exception"));

                //Act
                await eventBusService['processUpload'](TdeiObjectFaker.getGtfsFlexQueueMessageSuccess());
            });

            test("When permission denied, Expect to fail the message processing", async () => {
                let messagedProcessed: boolean = false;
                //Arrange
                mockQueueMessageContent(false);

                var mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeFalsy();
                    return Promise.resolve();
                };

                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                var dummyResponse = <GtfsFlexDTO>{
                    tdei_record_id: "test_record_id"
                };
                const createGtfsFlexSpy = jest
                    .spyOn(flexService, "createGtfsFlex")
                    .mockResolvedValueOnce(dummyResponse);

                //Act
                await eventBusService['processUpload'](TdeiObjectFaker.getGtfsFlexQueueMessageSuccess());
            });
        });
    });
});

