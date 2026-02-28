import {
    Box, Card, CardActionArea, CardContent, CircularProgress,
    IconButton,
    Paper,
    Stack,
    SvgIcon,
    Tooltip,
    Typography
} from "@mui/material";
import React, {useEffect, useMemo, useState} from "react";
import {Add, Block} from "@mui/icons-material";

import InterceptionConfigurationCard from "./InterceptionConfigurationCard.jsx";

export default function ErrorInjectionControl(
    {
        deviceId=-1,
        deviceName="",
        mqttTopicRoot = "",
        suppressedTopicsMap=new Map(),
        interceptedTopicsMap=new Map(),
        updateTopicMaps=(suppressed, intercepted)=>{},
    }
) {
    const extractPattern = (topicsMap) => {
        return topicsMap.get(deviceId).config.map((item)=> {
            const { topic, template, rule } = item;
            //infer what has been done previously
            const jsonTemplate = template?.json || {};
            const plainTemplate = template?.plain || "";
            const jsonTemplateActive = template?.json || false;
            //
            const jsonRule = rule?.json || {};
            const plainRule = rule?.plain || "";
            const jsonRuleActive = (rule.plain === "*") ? 2 : (rule.plain === "") ? 0 : 1;

            const pattern = topic.split(mqttTopicRoot)[1];

            return { topic: pattern, jsonTemplate, plainTemplate, jsonTemplateActive, jsonRule, plainRule, jsonRuleActive }
        });

    }

    // defer from map
    const { suppressed, intercepted} = useMemo(() => {
        const suppressed = (suppressedTopicsMap.get(deviceId)?.state !== undefined) ? suppressedTopicsMap.get(deviceId).state : false;
        const intercepted = (interceptedTopicsMap.get(deviceId)?.state !== undefined) ? interceptedTopicsMap.get(deviceId).state : false;
        if(!interceptedTopicsMap.has(deviceId)) return { suppressed, intercepted, interceptionItems: [] };

        const pattern = extractPattern(interceptedTopicsMap);

        return { suppressed, intercepted, interceptionItems: pattern };
    }, [deviceId, suppressedTopicsMap, interceptedTopicsMap]);

    const [activeControl, setActiveControl] = useState(-1);
    const [updateCounter, setUpdateCounter] = useState(0);
    const [interceptionItems, setInterceptionItems ] = useState([]);
    const [loadPattern, setLoadPattern] = useState(false);

    const handleDeleteInterceptionPattern = (index) => {
       interceptionItems.splice(index, 1);
       setInterceptionItems(()=>new Array(...interceptionItems));
       //method propagates changes to map
       activateInterception();
    }

    const activateSuppression = () => {
        //check if an entry exists, if not create one
        suppressedTopicsMap.set(deviceId, { state: true, topic: mqttTopicRoot });
        //check if interception is active for this topic/device, if so deactivate it
        if(!interceptedTopicsMap.has(deviceId)){
            interceptedTopicsMap.set(deviceId, { state: false, topic: mqttTopicRoot, config: [] });
        }else{
            interceptedTopicsMap.get(deviceId).state = false;
        }
        updateTopicMaps(new Map(suppressedTopicsMap), new Map(interceptedTopicsMap));
    }

    const deactivateSuppression = () => {
        suppressedTopicsMap.set(deviceId, { state: false, topic: mqttTopicRoot });
        updateTopicMaps(new Map(suppressedTopicsMap), interceptedTopicsMap);
    }

    const processInterceptionPattern = () => {
        console.log(interceptionItems)
        return interceptionItems.map((item, index)  => {
            const p = {
                topic: `${mqttTopicRoot}${item.topic}`,
                template: {},
                rule: {}
            };
            (item.jsonTemplateActive) ? p.template.json = item.jsonTemplate : p.template.plain = item.plainTemplate;
            //works for json and plan, "all" wildcard will be transported as plain message
            (item.jsonRuleActive === 0) ? p.rule.json = item.jsonRule : p.rule.plain = item.plainRule;

            return p;
        })
    }

    const activateInterception = () => {
        interceptedTopicsMap.set(deviceId, { state: true, topic: mqttTopicRoot, config: processInterceptionPattern()});
        // deactivate suppression
        suppressedTopicsMap.set(deviceId, { state: false, topic: mqttTopicRoot });
        updateTopicMaps(new Map(suppressedTopicsMap), new Map(interceptedTopicsMap));
    }

    const deactivateInterception = () => {
        interceptedTopicsMap.get(deviceId).state = false;
        updateTopicMaps(suppressedTopicsMap, new Map(interceptedTopicsMap));
    }
    // --- effects ---
    useEffect(()=>{
        setUpdateCounter(()=>updateCounter+1);
        console.log(`trigger update ${updateCounter}`);
    },[suppressedTopicsMap, interceptedTopicsMap]);

    useEffect(() => {
        //reset
        setActiveControl((intercepted) ? 0 : -1);
    }, [ suppressed, intercepted]);

    useEffect(() => {
        //reset after selected node has changed
        console.log('reset')
        setUpdateCounter(()=>0);
        setInterceptionItems(()=>[]);
        setLoadPattern(true);
    }, [deviceId]);

    useEffect(() => {
        console.log('get pattens')
        //pseudo loading... setting the loadPattern to true will render a circular progress spinner and unmount the
        // previously loaded pattern
        setTimeout(()=>{
            setLoadPattern(false);
        }, 1000)

        if(!interceptedTopicsMap.has(deviceId)) return;

        const topics = extractPattern(interceptedTopicsMap);
        console.log('set interceptionItems to: ', topics);
        setInterceptionItems(()=> new Array(...topics));
    }, [deviceId]);

    return (
        <Paper
            elevation={4}
            sx={{
                width: 300,
                minHeight: 470,
                borderRadius: 4,
                mx: 'auto',
                mt: 4,
                pb: 3,
                overflow: 'hidden',
            }}
        >
            {/*Main Content*/}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 3,
                    ml: 1,
                    mr: 1
                }}
            >
                <Typography
                    variant="h5"
                    fontWeight={600}
                    gutterBottom
                >
                    { deviceName }
                </Typography>
                <Tooltip title={"This is the base MQTT topic for this device"}>
                    <Typography
                        variant="paragraph"
                        fontWeight={600}
                        gutterBottom

                    >
                        { mqttTopicRoot }
                    </Typography>
                </Tooltip>
                {/*Control elements*/}
                <Box
                    sx={{
                        m: 1,
                        minHeight: 320,
                        maxHeight: 320,
                        overflowY: 'auto',
                        minWidth: '100%',
                        overflowX: 'hidden',
                        justifyContent: 'center',
                        '&. ' : {}
                    }}
                >
                    { (activeControl === 0) && (
                        <Card
                            sx={{
                                height: "100%",
                                maxHeight: 35,
                                mr: 1, ml:1, mt: 1,
                                borderRadius: 2.5,
                                width: '90%',
                                '&:hover' : {
                                    width: '92%',
                                    height: '100%',
                                    transition: '0.2s'
                                }

                            }}
                        >
                            <Tooltip title={"Create a new interception pattern"}>
                                <CardActionArea
                                    sx={{
                                        height: '100%',
                                        maxHeight: 35,
                                        '&[data-active]': {
                                            backgroundColor: 'action.selected',
                                            '&:hover': {
                                                backgroundColor: 'action.selectedHover',
                                            },
                                        },
                                    }}
                                    onClick={()=>{
                                        const current = interceptionItems;
                                        current.push({
                                            plainTemplate: "double",
                                            jsonTemplate: {"state" : "on"},
                                            jsonTemplateActive: true,
                                            plainRule: "single",
                                            jsonRule: { "state" : "off" },
                                            jsonRuleActive: 0,
                                            topic : "/new",
                                            conflictStatus: 0,
                                            conflictMessage: "No interference with other interceptions detected &#x1F44D;",
                                        });
                                        setInterceptionItems(()=>new Array(...current));
                                        // console.log(interceptionItems);
                                    }}
                                >
                                    <CardContent sx={{ maxHeight: 35 , height: 35, m:0, p:0.5 }}>
                                        <IconButton
                                            size="small"
                                            sx={{
                                                border: "solid 2px",
                                                maxWidth:25,
                                                maxHeight: 25
                                             }}
                                            color="primary"
                                        >
                                            <Add/>
                                        </IconButton>
                                    </CardContent>
                                </CardActionArea>
                            </Tooltip>
                        </Card>
                    )}
                        {/*active interceptions*/}
                    { (loadPattern && activeControl === 0) ? (
                            <CircularProgress color="primary" sx={{ mt:4 }}/>
                        ): (
                            (interceptionItems.length > 0 && activeControl === 0) && (
                                <Stack direction="column-reverse">
                                    {
                                        new Array(...interceptionItems).map((item, index) => {
                                                // return (<Typography variant={"body2"}>[{index}] {item.topic} </Typography>)
                                                // console.log(item);
                                                return (<InterceptionConfigurationCard
                                                    key={`interception-pattern-${index}`}
                                                    initTopic={item.topic}
                                                    initJsonTemplate={item.jsonTemplate}
                                                    initPlainTemplate={item.plainTemplate}
                                                    initJsonRule={item.jsonRule}
                                                    initPlainRule={item.plainRule}
                                                    topicRoot={mqttTopicRoot}
                                                    initJsonRuleActive={item.jsonRuleActive}
                                                    initJsonTemplateActive={item.jsonTemplateActive}
                                                    updateInterception={(item) => {
                                                        //skip an update after the selected node has changed
                                                        if (updateCounter === 0) {
                                                            setUpdateCounter(1)
                                                            return;
                                                        }
                                                        const updated = interceptionItems;
                                                        console.log(updated)
                                                        updated[index] = item;
                                                        setInterceptionItems(new Array(...updated));
                                                        // gathers the required data and triggers an update
                                                        activateInterception();
                                                    }}
                                                    conflictStatus={item.conflictStatus}
                                                    conflictMessage={item.conflictMessage}
                                                    onDeleteClicked={() => {
                                                        handleDeleteInterceptionPattern(index)
                                                    }}
                                                />)
                                            }
                                        )
                                    }
                                </Stack>)
                        )
                    }
                </Box>

                {/*Control buttons*/}
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    {/*Block all communication*/}
                    <Tooltip title={(suppressed) ? `Unblock all communication to this device` : `Block all communication`}>
                        <IconButton
                            color={ suppressed ? "primary" : "default"}
                            onClick={
                                () => {
                                    if(deviceId === -1) return;
                                    (!suppressed) ? activateSuppression() : deactivateSuppression();
                                }
                            }
                            sx={{
                                border: suppressed ? "2px solid" : "2px solid transparent",
                            }}
                            onHover={()=>{
                                setActiveControl(-1);
                            }}
                            disabled={deviceId === -1}
                        >
                            <Block/>
                        </IconButton>
                    </Tooltip>
                    {/*Activate Interception*/}
                    <Tooltip title={(intercepted) ? `Deactivate Interception` : `Activate Interception`}>
                        <IconButton
                            color={(intercepted) ? 'primary' : 'default'}
                            onClick={
                                () => {
                                    if(deviceId === -1) return;

                                    (!intercepted) ? activateInterception(): deactivateInterception();
                                }
                            }
                            sx={{
                                border: intercepted ? `2px solid` : '2px solid transparent',
                            }}
                            disabled={deviceId === -1}
                        >
                            <SvgIcon >
                                    <g transform="scale(0.75) translate(2,2)">
                                        <path d="M12.951,3.848H4.987C3.337,3.848,2,5.185,2,6.834v4.739c0,1.649,1.337,2.987,2.987,2.987h7.964   c1.649,0,2.987-1.337,2.987-2.987V6.834C15.937,5.185,14.6,3.848,12.951,3.848z M12.547,8.371l-2.93,1.17   C9.408,9.625,9.188,9.667,8.969,9.667S8.529,9.625,8.321,9.542L5.39,8.371c-0.461-0.185-0.686-0.708-0.502-1.17   c0.185-0.461,0.708-0.686,1.17-0.502l2.93,1.17l2.892-1.17c0.462-0.185,0.985,0.041,1.17,0.502   C13.233,7.663,13.009,8.187,12.547,8.371z"/>
                                        <path d="M27.013,17.44h-7.964c-1.649,0-2.987,1.337-2.987,2.987v4.739c0,1.649,1.337,2.987,2.987,2.987h7.964   c1.649,0,2.987-1.337,2.987-2.987v-4.739C30,18.777,28.663,17.44,27.013,17.44z M26.61,21.963l-2.93,1.17   c-0.21,0.083-0.43,0.125-0.649,0.125s-0.438-0.042-0.647-0.125l-2.932-1.17c-0.461-0.185-0.687-0.708-0.502-1.169   c0.185-0.462,0.71-0.685,1.17-0.502l2.931,1.17l2.892-1.17c0.462-0.182,0.986,0.04,1.17,0.502   C27.297,21.255,27.071,21.779,26.61,21.963z"/>
                                        <path d="M21.094,10.745c0.176,0.175,0.406,0.263,0.637,0.263s0.461-0.088,0.637-0.264c0.352-0.352,0.352-0.921,0-1.273   l-0.124-0.124h0.896c0.686,0,1.243,0.558,1.243,1.244v3.153c0,0.497,0.403,0.9,0.9,0.9s0.9-0.403,0.9-0.9v-3.153   c0-1.679-1.366-3.044-3.044-3.044h-0.896l0.124-0.124c0.352-0.352,0.353-0.921,0.001-1.273s-0.923-0.351-1.272,0l-1.661,1.66   c-0.169,0.169-0.265,0.398-0.265,0.637s0.096,0.468,0.264,0.637L21.094,10.745z"/>
                                        <path d="M10.905,21.256c-0.352-0.352-0.921-0.352-1.272,0c-0.352,0.351-0.352,0.921,0,1.272l0.124,0.125H8.86   c-0.686,0-1.244-0.558-1.244-1.244v-3.153c0-0.497-0.403-0.9-0.9-0.9s-0.9,0.403-0.9,0.9v3.153c0,1.679,1.365,3.044,3.043,3.044   h0.896l-0.124,0.124c-0.352,0.352-0.352,0.921,0,1.273c0.176,0.176,0.406,0.264,0.637,0.264s0.46-0.088,0.636-0.263l1.661-1.66   c0.169-0.169,0.264-0.398,0.264-0.637s-0.095-0.468-0.264-0.636L10.905,21.256z"/>
                                    </g>
                            </SvgIcon>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
        </Paper>
    )

}