
export interface IEventBusServiceInterface {
    /**
     * Subscribing to the interested topic & subscription to process the queue message
     */
    subscribeTopic(): void
}