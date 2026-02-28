import {Box, Divider, Grid2, IconButton, Paper, Stack, Switch, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import SwitchStateItem from "../base/SwitchStateItem.jsx";
import {Add, Lightbulb} from "@mui/icons-material";
import VerticalSwitchIcon from "../icons/VerticalSwitchIcon.jsx";
import AddDeviceButton from "../base/AddDeviceButton.jsx";
import {createSwitchItem} from "../factories/SwitchItemFactory.js";
import {fetchAvailableDevices, filterOptions} from "./utils.js";


export default function SwitchEditor(
    {
        initItems = new Map(),
        onUpdate=(items)=>{}
    }
) {
    // handler
    const setOn = (state, index, data) => {
        const item = data[index];
        item.on = state;
        setSwitchItems(()=>new Array(...data));
    }

    const attachHandler = (item) => {
        item.setOn = setOn;
        item.onDelete = onDelete;
        return item
    }

    const onDelete = (data, entityId) => {
        // console.log(data);
        const i = data.findIndex((item)=> item.entityId === entityId);
        if (i === -1) return;
        const update = [...data.slice(0, i), ...data.slice(i + 1)];
        // console.log('updated switchItems:', update);
        setSwitchItems(()=>new Array(...update));
    }

    const onAdd = (item={entityId: "", friendlyName: ""}) => {
        createSwitchItem(
            item.entityId
        ).then((result)=>{
            attachHandler(result);
            switchItems.push(result);
            setSwitchItems(()=>new Array(...switchItems));
        })
    }

    const update = () => {
        const updateCollector = [];
        switchItems.forEach((item,index) => {
            updateCollector.push(item);
        });
        onUpdate(updateCollector);
    }
    // --- States ---
    const [switchItems, setSwitchItems] = useState(
        () => {
            const collector = [];
            initItems.forEach(
                (item) => {
                    if (!item.entityId.startsWith("switch.")) return;
                    attachHandler(item)
                    collector.push(item);
                    // console.log(item);
                }
            );
            return collector;
        }
    );
    const [ options, setOptions ] = useState([]);
    const [ initOptions, setInitOptions ] = useState([]);
    const [ updateCounter, setUpdateCounter ] = useState(0);

    // --- Effects ---
    useEffect(() => {
        fetchAvailableDevices("switch.", switchItems, false).then((result)=>{
            const { filtered, opts }  = result
            setOptions(()=>filtered);
            setInitOptions(()=>opts);
        })
    }, []);

    useEffect(() => {
        const filtered = filterOptions(initOptions, switchItems);
        setOptions(()=>filtered);
    }, [switchItems]);

    useEffect(()=>{
        setUpdateCounter(()=>updateCounter+1 );
        if (updateCounter !== 0) update();
        console.log(`update received. Counter=${updateCounter}`);
    }, [switchItems]);

    return (
        <Paper
            elevation={6}
            sx={{
                borderRadius: 4,
                p: 2
            }}
        >
            <Grid2
                spacing={1}
                container
            >
                <Grid2 size={12}>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-start" }}>
                        {/*TODO: Improve Icon*/}
                        <VerticalSwitchIcon/>
                        <Typography variant="h5" component="div">Switches</Typography>
                    </Stack>
                    <Divider/>
                </Grid2>
                <Grid2 spacing={1} container size={12}>
                {
                    (switchItems.length > 0) && switchItems.map((item, index) => (
                        <Grid2 size={3} key={`edit-switch-${index}`}>
                             <SwitchStateItem

                                //     friendlyName={item.friendlyName}
                                //     // key={index}
                                //     setOn={
                                //         (v)=>{
                                //             setOn(v, index);
                                //     }
                                // }
                                // on={item.on}
                                // onDelete={()=>{
                                //     onDelete(item.entityId);
                                // }}
                                // isReadOnly={false}
                                 props={{ data: switchItems, index: index}}
                             />
                        </Grid2>
                    ))
                }
                    <Grid2 size={2}>
                        <Paper
                            elevation={6}
                            sx={{
                                borderRadius:  2,
                                minHeight: 71,
                                maxHeight: 80,
                                p:1
                            }}
                        >
                            <Stack
                                direction="column"
                                spacing={2}
                                sx={{
                                    p:1,
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <AddDeviceButton
                                    options={ options }
                                    onAdd={onAdd}
                                />
                            </Stack>
                        </Paper>
                    </Grid2>
                </Grid2>


            </Grid2>
        </Paper>
    )
}