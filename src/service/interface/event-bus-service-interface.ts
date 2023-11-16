import { Topic } from "nodets-ms-core/lib/core/queue/topic";

export interface IEventBusServiceInterface {
    /**
     * Subscribing to the interested topic & subscription to process the queue message
     */
    subscribeTopic(): void;
    //publishingTopic: Topic;
}