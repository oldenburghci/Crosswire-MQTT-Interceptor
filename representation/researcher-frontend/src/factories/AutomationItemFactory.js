import axios from "axios";

const createAutomationItem = async (entityId = "", previous = null) => {

    let result = {};
    //fetched from SHH
    const fromMessage = (attributes, state) => {
        return {
            on: (state === "on"),
            friendlyName: attributes.friendly_name,
            internalId: attributes.id,
            triggers: attributes.triggers ?  attributes.triggers.map((item) => { return { triggers : item, friendlyName: attributes.friendly_name, entityId: entityId }}) : [],
            conditions: attributes.conditions ? attributes.conditions.map((item) => { return { conditions : item, friendlyName: attributes.friendly_name, entityId: entityId }}) : [],
            actions: attributes.actions ? attributes.actions.map((item) => { return { actions : item, friendlyName: attributes.friendly_name, entityId: entityId }}) : [],
            mode: attributes.mode,
            alias: attributes.alias,
        }
    }
    //prepare for persistent layer and SHH on run
    const toMessage = (input) => {
        const converted = {
            service: (input.on) ? "turn_on" : "turn_off",
            entityId: input.entityId,
            friendlyName: input.friendlyName,
            key: input.key,
            definition: {
                internalId: input.internalId,
                mode: input.mode,
                triggers: input.triggers.map((item)=> {
                    // console.log(item);
                    return {"json": item.triggers, friendlyName: item.friendlyName, entityId: item.entityId}
                }),
                conditions: input.conditions.map((item)=> {
                    return {"json": item.conditions, friendlyName: item.friendlyName, entityId: item.entityId}
                }),
                actions: input.actions.map((item)=> {
                    return {"json": item.actions, friendlyName: item.friendlyName, entityId: item.entityId}
                }),
                alias: input.alias
            }
        }
        return converted;
    }
    // from persistent layer
    const alignPrevious = (previous) => {
        return {
            entityId : previous.entityId,
            on: (previous.service === "turn_on"),
            internalId : previous.currentDefinition.internalId,
            triggers: previous.currentDefinition.triggers.map((item) => {
                return { triggers: item.json, friendlyName: item.friendlyName, entityId: item.entityId };
            } ),
            conditions: previous.currentDefinition.conditions.map((item) => {
                return { conditions: item.json, friendlyName: item.friendlyName, entityId: item.entityId };
            }),
            actions: previous.currentDefinition.actions.map((item) => {
                return { actions: item.json, friendlyName: item.friendlyName, entityId: item.entityId };
            }),
            mode: previous.currentDefinition.mode,
            description: previous.currentDefinition.description,
            alias: previous.currentDefinition.alias,
            friendlyName: previous.friendlyName,
            key: previous.key,
        }
    }

    result = {
        entityId: entityId,
        on: undefined,
        internalId: undefined,
        triggers: undefined,
        conditions: undefined,
        actions: undefined,
        mode: undefined,
        description: undefined,
        alias: undefined,
        key: undefined,
    }
    result.alignPrevious = alignPrevious;
    result.fromMessage = fromMessage;
    result.toMessage = toMessage;

    if (previous) {
        result = { ...result, ...alignPrevious(previous) };
        return result;
    }

    await axios.get(
        `/api/states/${entityId}`
    ).then(async response => {
        const {entity_id, attributes, state} = response.data;
        const internalId = attributes.id;

        await axios.get(
            `/api/config/automation/config/${internalId}`
        ).then(async response => {
            const { id, triggers, conditions, actions, mode, alias, description } = response.data;
            attributes.id = id;
            attributes.triggers = triggers;
            attributes.conditions = conditions;
            attributes.mode = mode;
            attributes.actions = actions;
            attributes.alias = alias;
            attributes.description = description;
            result = {...result, ...result.fromMessage(attributes, state)};
            result.entityId = entity_id;
        }).catch((error) => {
            console.error(error);
            return null;
        })
    }).catch((error) => {
        console.log(error);
    });

    return result;
}

export { createAutomationItem }