import axios from "axios";

const createSwitchItem = async (entityId="", previous=null) => {
    //convert the raw message from the shh into
    const fromMessage = (attributes, state) => {
        return {
            on: (state === 'on'),
            friendlyName: attributes.friendly_name,
        }
    }
    // convert the current item into a state where the shh can read and trigger the action, e.g. the friendlyName
    // attribute is important from the usability but result in failure if send to the shh as it. Therefore, we store
    // those information in capabilities, a persistence layer only storage
    const toMessage = () => {
        return {
            entity_id: result.entityId,
            domain: "switch",
            service: (result.on) ? "turn_on" : "turn_off",
            capabilities: {
                friendlyName: result.friendlyName,
            }
        }
    }
    //merge an item from the persistence layer into something usable on the application level
    const alignPrevious = (previous) => {
        return {
            on: (previous.service === "turn_on"),
            entityId : previous.entity_id,
            friendlyName: previous.capabilities.friendlyName,
        }
    }

    let result = {
        entityId: entityId,
        on: undefined,
        alignPrevious,
        fromMessage,
        toMessage
    }

    if (previous) {
        result = {...result, ...alignPrevious(previous)};
        result.toMessage = toMessage;
        result.fromMessage = fromMessage;
        result.alignPrevious = alignPrevious;
        // console.log('from previous: ', previous, result);
        return result;
    }

    await axios.get(
        `/api/states/${entityId}`
    ).then((response) => {
        const { entity_id, attributes, state } = response.data;
        // console.log(attributes, state);
        result = {  ...result, ...result.fromMessage(attributes, state)};
        result.entityId = entity_id;
        result.toMessage = toMessage;
        result.fromMessage = fromMessage;
        result.alignPrevious = alignPrevious;
        // console.log('from remote: ', result)
    }).catch((error) => {
        console.log(error);
    });
    // console.log(result);
    return result;
}

export { createSwitchItem }