import {Box, Divider, Grid2, Paper, Stack, Typography} from "@mui/material";
import {Add, Lightbulb} from "@mui/icons-material";
import {FixedSizeList} from "react-window";
import {useCallback, useEffect, useMemo, useState} from "react";
import LightListItem from "../base/LightListItem.jsx";
import LightweightLightControl from "../controls/LightweightLightControl.jsx";
import AddDeviceButton from "../base/AddDeviceButton.jsx";
import {createLightItem} from "../factories/LightItemFactory.js";
import {fetchAvailableDevices, filterOptions} from "./utils.js";

export default function LightsEditor({
    // initItems=[],
    initItems = new Map(),
    onUpdate=(items)=>{}
 }) {

    const setOn =(flag, index, data) => {
        const item = data[index];
        item.on = flag;
        console.log('data: ', data, 'lightItems: ', lightItems );
        // const copyItems = data;
        // copyItems[index] = item;
        setLightItems(()=> new Array(...data));
    }

    // activate control for this element on click. The
    const setActiveControlElement = (indexControlElement, index, data) => {
        console.log("data", data);
        data.forEach((item) => {
            item.activeControlElement = {controlElement: indexControlElement, index: index};
        });
        setLightItems(()=> new Array(...data));
    }

    // set flag
    const setBrightness = (flag, index, data) => {
        const item = data[index];
        item.brightness = flag;
        setLightItems(()=> new Array(...data));
    }

    const setBrightnessPct = (pct, index, data) => {
        const item = data[index];
        item.brightnessPct = pct;
        setLightItems(()=> new Array(...data));
    }

    const setRGBColor = (flag, index, data) => {
        const item = data[index];
        item.rgbColor = flag;
        setLightItems(()=> new Array(...data));
    }
    //use for transition flag
    const setTransition = (flag, index, data) => {
        const item = data[index];
        item.transition = flag;
        setLightItems(()=> new Array(...data));
    }
    //use for transition time
    const setTransitionTime = (time, index, data) => {
        // console.log(time);
        const item = data[index];
        item.transitionTime = time;
        setLightItems(()=> new Array(...data));
    }

    const setFlash = (flag, index, data) => {
        const item = data[index];
        item.flash = flag;
        setLightItems(()=> new Array(...data));
    }

    const setSelectedEffectIndex = (menuIndex, index, data) => {
        const item = data[index];
        item.selectedEffectIndex = menuIndex;
        setLightItems(()=> new Array(...data));
    }

    const setColor = (color, index, data) => {
        console.log(color, index);
        const item = data[index];
        item.color = color;
        setLightItems(()=> new Array(...data));
    }

    const onAdd = (item={friendlyName : "", entityId : ""}) => {
        //fetch new data for the device
        const { friendlyName, entityId } = item;
        createLightItem(
            entityId
        ).then((result)=>{
            //attach handler
            attachHandler(result);
            // console.log(result);
            lightItems.unshift(result);

            result.isReadOnly=false;
            setLightItems(()=> new Array(...lightItems));
        });
    }

    // const filterOptions = (opts, items) => {
    //     const optionSet = new Set(opts.map(item=>item.entityId));
    //     const itemSet = new Set([...items].map(item=>item.entityId));
    //     const difference = optionSet.difference(itemSet);
    //     const filtered = Array.from(difference);
    //     return filtered.map((item)=>{
    //         return {entityId : item, friendlyName : opts.find((opt) => opt.entityId === item).friendlyName };
    //     });
    // }

    const onDelete =(data, entityId) => {
        const i = data.findIndex((item)=>item.entityId === entityId);
        if (i === -1) return;
        const update = [...data.slice(0, i), ...data.slice(i + 1)];
        // console.log(update);
        setLightItems(()=> new Array(...update));
    }

    const attachHandler = (item) => {
        item.setOn = setOn;
        item.setBrightness = setBrightness;
        item.setActiveControlElement = setActiveControlElement;
        item.setRGBColor = setRGBColor;
        item.setTransition = setTransition;
        item.setFlash = setFlash;
        item.setSelectedEffectIndex = setSelectedEffectIndex;
        item.onDelete = onDelete

        return item;
    }

    // translate item into a pushable update state
    const update = () => {
        const updateCollector = [];
        lightItems.forEach((item,index) => {
            // const m = item.toMessage();
            updateCollector.push(item);
            // return item;
        });
        // console.log(lights);
        onUpdate(updateCollector);
    }

    // --- States ----
    // const [deleteEntity,setDeleteEntity] = useState(null);
    const [options, setOptions] = useState([]);
    const [initOptions, setInitOptions] = useState([]);
    const [updateCounter, setUpdateCounter] = useState(0);
    // const [items, setItems] = useState(
        // initItems.map(item=> {
        //     console.log(item);
        //     return attachHandler(item)
        // })
    // );
    const [lightItems, setLightItems] = useState(
        ()=>{
            const collector = [];
            initItems.forEach(
                (item)=> {
                    if (!item.entityId.startsWith("light.")) return;
                    //activate the delete option by setting the isReadOnly flag to false
                    item.isReadOnly = false;
                    attachHandler(item)
                    collector.push(item);
                    // console.log(item);
                }
            );
            return collector;
        }
    );
    // console.log('LightsEditor items: ', lightItems);

    const getLightItems = useCallback(() => {
        return lightItems;
    }, [lightItems]);

    // --- memos ---
    const {activeItem} = useMemo(()=>{
        const activeItem = (lightItems.length > 0) ? lightItems[lightItems[0].activeControlElement.index] : undefined;
        return { activeItem };
    }, [lightItems]);
    // --- effects ---
    useEffect(() => {
        fetchAvailableDevices("light.",lightItems, false).then((result)=>{
            const {filtered, opts} = result;
            setOptions(()=>filtered);
            setInitOptions(()=>opts);
        })

    }, []);

    useEffect(()=>{
        //update options
        const filtered = filterOptions(initOptions, lightItems);
        setOptions(()=>filtered);
    }, [lightItems]);

    useEffect(() => {
        setUpdateCounter(()=>updateCounter+1 );
        if (updateCounter !== 0) update();
        // console.log(`update received. Counter=${updateCounter}`);
    }, [lightItems]);
    // --- Component Markup ---
    return (
        <Paper elevation={6} sx={{
            borderRadius: 4,
            p: 2,
        }}>
            <Grid2 container spacing={1}>
                {/*Headline*/}
                <Grid2 size={12}>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-start" }}>
                        {/*TODO: Improve Icon*/}
                        <Lightbulb/>
                        <Typography variant="h5" component="div">Lights</Typography>
                    </Stack>
                    <Divider/>
                </Grid2>
                <Grid2 size={9}>
                    {/*Use Box because FixedSizeList does not accept sx */}
                    <Box sx={{ml:2}}>
                        {(lightItems.length > 0) && <FixedSizeList
                            height={lightItems.length * 65}
                            itemSize={65}
                            itemCount={lightItems.length}
                            overscanCount={5}
                            itemData={lightItems}
                        >
                            {LightListItem}
                        </FixedSizeList>}
                        {/*  Add item   */}
                        <Grid2
                            size={12}
                            container
                            className={
                                ((lightItems.length % 2) !== 0) ? "RowOdd" : "RowEven"
                            }
                            sx={{
                                height: 55,
                                alignItems: "center",
                                // justifyContent: "center"
                            }}
                        >
                            <Grid2
                                size={3}
                            />
                            <Grid2
                                size={8}
                            >
                                <Paper
                                    elevation={8}
                                    sx={{
                                        minHeight: 40,
                                        borderRadius: 4,
                                        ml: 1,
                                        mr: 1
                                    }}
                                >
                                    <AddDeviceButton
                                        onAdd={onAdd}
                                        options={options}
                                    />
                                </Paper>
                            </Grid2>
                        </Grid2>
                    </Box>
                </Grid2>
                <Grid2 size={3}>
                    <LightweightLightControl
                        index={
                            (activeItem !== undefined) ? activeItem.activeControlElement.index : -1
                        }
                        activeControlElement={
                            (activeItem !== undefined) ? activeItem.activeControlElement.controlElement : -1
                        }
                        updateColor={
                            (color) => {
                                setColor(color, activeItem.activeControlElement.index, lightItems);
                            }
                        }
                        initColor={
                            (activeItem !== undefined) ? activeItem?.color :`rgb(213,175,87)`
                        }
                        data = {
                            activeItem
                        }
                        setTransition={
                            (v) => {
                                setTransitionTime(v, activeItem.activeControlElement.index, lightItems);
                            }
                        }
                        transition={
                            (activeItem !== undefined) ? activeItem.transitionTime : 0
                        }
                        brightness={
                            (activeItem !== undefined) ? activeItem.brightnessPct : 0
                        }
                        setBrightness={
                            (v)=>{
                                setBrightnessPct(v, activeItem.activeControlElement.index, lightItems);
                            }
                        }
                    />
                </Grid2>
            </Grid2>
        </Paper>
    )
}