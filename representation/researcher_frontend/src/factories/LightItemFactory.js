import axios from "axios";
import {ColorService} from "react-color-palette";

const createLightItem = async (entityId = "", previous=null) => {
    // additional functions
    let result = {}
    const alignPrevious = (prev) => {
        const converted = {
            on: (prev.service === "turn_on"),
            entityId : prev.entity_id,
            capabilities: prev.capabilities,
            friendlyName: prev.capabilities.friendlyName,
            transition: (prev.transition > 0),
            transitionTime: (prev.transition > 0) ? prev.transition : 0,
            flash: (prev?.flash === 'long'),
            // check if the device has the functionality to adjust the color
            rgbColor :(prev?.rgb_color !== undefined) ? prev.rgb_color : prev.capabilities?.rgbColor,
            color : prev?.rgb_color ? `rgb(${prev.rgb_color[0]}, ${prev.rgb_color[1]}, ${prev.rgb_color[2]})` : `rgb(213, 175, 87)`,
            //if the pct was set before use this value, if not, check if this device has the capabilities to adjust brightness.
            //In case there is no entry in capabilities, the last query results to undefined which means that adjustments are not possible
            brightness: prev.brightness_pct ? (prev.brightness_pct > 0) : prev.capabilities?.brightness,
            brightnessPct : prev.brightness_pct,
            effectList:  ['none', ...prev.capabilities.effectList],
            selectedEffectIndex: (prev?.effect !== undefined) ? ['none', ...prev.capabilities.effectList].indexOf(prev.effect) : -1,
        }
        return converted;
    }

    const fromMessage = (attributes, state) => {
        const converted = {}
        //infer the state from the fetched data
        converted.on = (state === 'on');
        converted.friendlyName = attributes.friendly_name;

        const supported_color_modes = new Set(attributes?.supported_color_modes);
        converted.rgbColor =
            (supported_color_modes.intersection(new Set(["hs", "xy", "rgb", "rgbw", "rgbww"])).size > 0) ?
                (state === "on") : undefined;
        converted.brightness =
            (supported_color_modes.intersection(new Set(["brightness", "color_temp", "hs", "xy", "rgb", "rgbw", "rgbww"])).size > 0) ?
                (state === "on") : undefined;

        if(attributes.brightness !== null)
            converted.brightnessPct = Math.ceil((100 * attributes?.brightness) / 256);

        if(attributes.rgb_color !== null)
            converted.color = `rgb(${attributes.rgb_color[0]} ${attributes.rgb_color[1]} ${attributes.rgb_color[2]})`;
        converted.effectList = ['none', ...attributes?.effect_list];

        converted.capabilities = {
            //friendly name is not an allowed field for service requests to home assistant
            friendlyName: attributes.friendly_name,
            rgbColor: converted.rgbColor,
            brightness: converted.brightness,
            effectList: attributes?.effect_list,
        }
        // console.log("converted FROM remote...")
        return converted;
    }

    // convert to a home assistant friendly format (e.g. "rgbColor" to "rgb_color")
    const toMessage = () => {
        const converted = {
            entity_id: result.entityId,
            // friendly_name: result.friendlyName,
            transition: (result.transition) ? result.transitionTime : 0,
            domain:  "light",
            service: (result.on) ? "turn_on" : "turn_off",
            capabilities: result.capabilities,
        }
        //possible for both services
        if (result.flash)
            converted.flash = 'long';

        if (result.on){
            //light "turn_on" service
            if (result.rgbColor) {
                const c = ColorService.convert("hex", result.color).rgb
                converted.rgb_color = [c.r, c.g, c.b];            }
            if (result.brightness)
                converted.brightness_pct = result.brightnessPct;
            if(result.selectedEffectIndex > 0)
                converted.effect = result.effectList[result.selectedEffectIndex]
        }else{
            // converted.service = "turn_off";
        }
        // console.log("converted TO remote...")
        return converted;
    }

    // console.log(result)

    result = {
        entityId: entityId,
        on: undefined,
        friendlyName: undefined,
        brightness: undefined,
        brightnessPct: 0,
        rgbColor: undefined,
        color: `rgb(213, 175, 87)`,
        transition: false,
        transitionTime: 0,
        flash: false,
        effectList: undefined,
        activeControlElement: { controlElement: -1, index: -1 },
        selectedEffectIndex: -1,
    }
    result.alignPrevious = alignPrevious;
    result.toMessage = toMessage;
    result.fromMessage = fromMessage;
    // console.log(result);
    if (previous) {
        result = {...result, ...result.alignPrevious(previous)};
    }
    //only an item that has been constructed in the factory previously has capabilities
    if( result?.capabilities !== undefined ) {
        //infer from capabilities what is possible with this light
        result = {...result, ...result.capabilities};
        // console.log("merge with previous capabilities...")
        // console.log(result);
        if (previous){
            result = {...result, ...result.alignPrevious(previous)};
        }
        // console.log("merge with previous...")
        // console.log(result);
        return result
    }
    // console.log(result);

    //fetch if information is missing
    await axios.get(
        `/api/states/${entityId}`
    ).then((response) => {
        const { attributes, state} = response.data;
        result = { ...result, ...result.fromMessage(attributes, state) };
        result.alignPrevious = alignPrevious;
        result.toMessage = toMessage;
        result.fromMessage = fromMessage;
    }).catch((error)=>{
        console.log(error);
    });

    return result;
}

export {createLightItem};