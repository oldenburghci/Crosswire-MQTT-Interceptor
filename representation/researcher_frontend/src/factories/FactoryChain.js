//a chain of responsibilities to identify and handle the correct factory method

import {createLightItem} from "./LightItemFactory.js";
import {createSwitchItem} from "./SwitchItemFactory.js";
import {createAutomationItem} from "./AutomationItemFactory.js";

const createFactoryLink = (targetDomain, factoryMethod=createLightItem) => {
    let result = new Promise((resolve, reject) => {})

    let next = null;

    const handle = (domain, entityId, json=null) =>{
        if (domain === targetDomain) {
            result = factoryMethod(entityId, json);
            return result;
        }
        if (next !== null) {
            //forward request
            return next.handle(domain, entityId, json);
        }else{
            // no responsible link found
            return null;
        }
    }

    //call after initialization
    const arrangeNext = (nextLink) => {
        next = nextLink
    }

    //return the link
    return {
        next, result, handle, arrangeNext,
    }
}

let factoryChain = [
    createFactoryLink("light", createLightItem),
    createFactoryLink("switch", createSwitchItem),
    createFactoryLink("automation", createAutomationItem)
]
factoryChain[0].arrangeNext(factoryChain[1]);
factoryChain[1].arrangeNext(factoryChain[2]);
factoryChain = factoryChain[0];

export { createFactoryLink, factoryChain }