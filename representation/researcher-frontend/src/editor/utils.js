import axios from "axios";
import {unmountComponentAtNode} from "react-dom";

const filterOptions = (opts, items) => {
    const optionSet = new Set(opts.map(item=>item.entityId));
    const itemSet = new Set([...items].map(item=>item.entityId));
    const difference = optionSet.difference(itemSet);
    const filtered = Array.from(difference);
    return filtered.map((item)=>{
        const i = opts.find((opt) => opt.entityId === item)
        return {entityId : item, friendlyName : i.friendlyName,  unavailable: i.unavailable };
    });
}

const fetchAvailableDevices = async (optInFilter="light.", items=[], dismissUnavailable=true) => {
    return axios.get(
        `api/states`
    ).then((response) => {
        // a huge array of entities
        const entities = response.data;

        const lights = entities.filter((entity) => {
            if (dismissUnavailable) {
                return entity.entity_id.startsWith(optInFilter) && entity.state !== 'unavailable';
            }else{
                // entity.unavailable = (entity);
                return entity.entity_id.startsWith(optInFilter);
            }
        })
        // console.log(lights);
        const opts = lights.map((item, index) => {
            // console.log(item);
            return { entityId : item.entity_id, friendlyName: item.attributes.friendly_name, unavailable: item.state === 'unavailable' };
        });
        // console.log(opts);
        // remove already used options
        const filtered = filterOptions(opts, items);
        return {filtered, opts};
        // setOptions(()=>filtered);
        // setInitOptions(()=>opts);
    }).catch((error) => {
        //TODO: toast to user
        console.error(error);
    });
}


export { filterOptions, fetchAvailableDevices }

