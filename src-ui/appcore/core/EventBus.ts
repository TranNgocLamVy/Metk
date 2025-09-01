import EventEmitter from "eventemitter3";

type EventBusEvent = {
}

export class EventBus extends EventEmitter<EventBusEvent> {
}