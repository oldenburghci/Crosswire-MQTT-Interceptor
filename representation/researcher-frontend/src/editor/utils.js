import axios from "axios";

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
                return entity.entity_id.startsWith(optInFilter);
            }
        })
        const opts = lights.map((item, index) => {
            return { entityId : item.entity_id, friendlyName: item.attributes.friendly_name, unavailable: item.state === 'unavailable' };
        });
        // remove already used options
        const filtered = filterOptions(opts, items);
        return {filtered, opts};
    }).catch((error) => {
        console.error(error);
    });
}


export { filterOptions, fetchAvailableDevices }

